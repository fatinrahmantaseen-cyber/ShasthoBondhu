"""Administrator authentication and security service.

Provides:
- PBKDF2-HMAC-SHA256 password hashing and constant-time verification.
- Cryptographically signed HMAC-SHA256 administrative access tokens.
- In-process login brute-force protection with failed attempt lockout.
- FastAPI dependencies for protected administrative endpoints.

Security note:
The LoginRateLimiter is an in-process, thread-safe rate limiter. In multi-worker
(e.g., uvicorn with multiple workers) or horizontally scaled multi-instance
deployments, brute-force tracking requires a centralized state store (e.g. Redis).
"""

import base64
import hashlib
import hmac
import json
import logging
import secrets
import threading
import time
import uuid
from typing import Optional, Tuple

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings

logger = logging.getLogger(__name__)

# Password hashing constants
PBKDF2_ALGORITHM = "pbkdf2_sha256"
PBKDF2_ITERATIONS = 600_000
SALT_BYTE_LENGTH = 16


def hash_password(password: str) -> str:
    """Generate a PBKDF2-HMAC-SHA256 hash with a cryptographically random salt.

    Format: pbkdf2_sha256$<iterations>$<salt_hex>$<hash_hex>
    """
    if not isinstance(password, str) or not password:
        raise ValueError("Password must be a non-empty string")

    salt = secrets.token_bytes(SALT_BYTE_LENGTH)
    derived = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PBKDF2_ITERATIONS,
    )
    return f"{PBKDF2_ALGORITHM}${PBKDF2_ITERATIONS}${salt.hex()}${derived.hex()}"


def verify_password(password: str, encoded_hash: Optional[str]) -> bool:
    """Verify a password against an encoded PBKDF2-HMAC-SHA256 hash.

    Uses constant-time comparison to prevent timing side-channel attacks.
    Safely rejects malformed or None hashes without leaking exceptions.
    """
    if not password or not encoded_hash or not isinstance(encoded_hash, str):
        return False

    parts = encoded_hash.split("$")
    if len(parts) != 4:
        return False

    algorithm, iters_str, salt_hex, hash_hex = parts

    if algorithm != PBKDF2_ALGORITHM:
        return False

    try:
        iterations = int(iters_str)
        if iterations < 100_000:
            return False
        salt = bytes.fromhex(salt_hex)
        expected_hash = bytes.fromhex(hash_hex)
    except (ValueError, TypeError):
        return False

    derived = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        iterations,
    )

    return hmac.compare_digest(derived, expected_hash)


def create_admin_token(
    username: str,
    expires_in_seconds: Optional[int] = None,
) -> Tuple[str, int]:
    """Issue a cryptographically signed HMAC-SHA256 token for an administrator.

    Returns a tuple of (token, expires_in_seconds).
    Token format: <base64url_payload>.<signature_hex>
    """
    secret_key = settings.ADMIN_SECRET_KEY
    if not secret_key or not secret_key.strip():
        raise RuntimeError("ADMIN_SECRET_KEY is not configured")

    if expires_in_seconds is None:
        expires_in_seconds = max(60, settings.ADMIN_TOKEN_EXPIRE_MINUTES * 60)

    now = int(time.time())
    exp = now + expires_in_seconds

    payload = {
        "sub": username,
        "role": "admin",
        "iat": now,
        "exp": exp,
        "jti": str(uuid.uuid4()),
    }

    # Compact JSON encoding
    payload_json = json.dumps(payload, separators=(",", ":"), sort_keys=True)
    payload_b64 = base64.urlsafe_b64encode(payload_json.encode("utf-8")).decode("ascii").rstrip("=")

    sig = hmac.new(
        secret_key.encode("utf-8"),
        payload_b64.encode("ascii"),
        hashlib.sha256,
    ).hexdigest()

    token = f"{payload_b64}.{sig}"
    return token, expires_in_seconds


def verify_admin_token(token: str) -> dict:
    """Verify an administrator token signature and validity.

    Raises HTTPException(401) on missing signature, tamper, expiration, or invalid claims.
    """
    secret_key = settings.ADMIN_SECRET_KEY
    if not secret_key or not secret_key.strip():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication configuration error: ADMIN_SECRET_KEY is not set",
        )

    parts = token.split(".")
    if len(parts) != 2:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token structure",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload_b64, signature_hex = parts

    # Recompute signature
    expected_sig = hmac.new(
        secret_key.encode("utf-8"),
        payload_b64.encode("ascii"),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(signature_hex, expected_sig):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token signature",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Base64url decode with padding
    try:
        padding = "=" * ((4 - len(payload_b64) % 4) % 4)
        raw_json = base64.urlsafe_b64decode((payload_b64 + padding).encode("ascii")).decode("utf-8")
        payload = json.loads(raw_json)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Validate claims
    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token claims",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if payload.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
            headers={"WWW-Authenticate": "Bearer"},
        )

    exp = payload.get("exp")
    if not exp or not isinstance(exp, (int, float)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing token expiration",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if int(exp) < int(time.time()):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

    sub = payload.get("sub")
    if not sub or not isinstance(sub, str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing token subject",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload


class LoginRateLimiter:
    """Thread-safe in-process rate limiter for admin login brute-force mitigation.

    Tracks failed attempts per key (typically client_ip:username).
    """

    def __init__(
        self,
        max_attempts: int = 5,
        window_seconds: int = 900,  # 15 minutes
        lockout_seconds: int = 900,  # 15 minutes
    ):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self.lockout_seconds = lockout_seconds
        self._lock = threading.Lock()
        self._attempts: dict[str, list[float]] = {}
        self._lockouts: dict[str, float] = {}

    def is_locked(self, key: str) -> Tuple[bool, int]:
        """Check if a key is currently locked out.

        Returns (is_locked, retry_after_seconds).
        """
        now = time.time()
        with self._lock:
            lockout_until = self._lockouts.get(key)
            if lockout_until:
                if now < lockout_until:
                    return True, int(lockout_until - now) + 1
                else:
                    # Lockout expired
                    del self._lockouts[key]
                    self._attempts.pop(key, None)
            return False, 0

    def record_failure(self, key: str) -> Tuple[bool, int]:
        """Record a failed login attempt.

        Returns (is_locked_now, retry_after_seconds).
        """
        now = time.time()
        with self._lock:
            # Clean old attempts outside window
            cutoff = now - self.window_seconds
            attempts = [t for t in self._attempts.get(key, []) if t > cutoff]
            attempts.append(now)
            self._attempts[key] = attempts

            if len(attempts) >= self.max_attempts:
                lockout_until = now + self.lockout_seconds
                self._lockouts[key] = lockout_until
                return True, self.lockout_seconds
            return False, 0

    def record_success(self, key: str) -> None:
        """Clear failed attempts upon successful login."""
        with self._lock:
            self._attempts.pop(key, None)
            self._lockouts.pop(key, None)

    def reset_all(self) -> None:
        """Clear all rate limiter state (useful for tests)."""
        with self._lock:
            self._attempts.clear()
            self._lockouts.clear()


# Shared singleton rate limiter for admin login
login_rate_limiter = LoginRateLimiter()

# HTTPBearer security dependency
bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> str:
    """FastAPI dependency to require and extract the current authenticated administrator username."""
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = verify_admin_token(credentials.credentials)
    return payload["sub"]


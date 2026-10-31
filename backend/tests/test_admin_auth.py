"""Unit tests for administrative password hashing, token issuance, and rate limiting."""

import time
import unittest
from unittest.mock import patch

from fastapi import HTTPException

from app.config import settings
from app.services.auth import (
    LoginRateLimiter,
    create_admin_token,
    hash_password,
    verify_admin_token,
    verify_password,
)


class TestAdminAuthService(unittest.TestCase):
    def setUp(self):
        self.test_password = "SuperStrongAdminPassword#2026"
        self.test_secret = "test-secret-key-32-bytes-long-for-hmac-sha256-safety"

    def test_hash_and_verify_password_success(self):
        encoded_hash = hash_password(self.test_password)
        self.assertTrue(encoded_hash.startswith("pbkdf2_sha256$600000$"))
        parts = encoded_hash.split("$")
        self.assertEqual(len(parts), 4)
        self.assertEqual(parts[0], "pbkdf2_sha256")
        self.assertEqual(parts[1], "600000")
        self.assertEqual(len(bytes.fromhex(parts[2])), 16)  # 16-byte salt
        self.assertEqual(len(bytes.fromhex(parts[3])), 32)  # SHA-256 derived key

        # Verification succeeds with matching password
        self.assertTrue(verify_password(self.test_password, encoded_hash))

    def test_verify_password_wrong_password(self):
        encoded_hash = hash_password(self.test_password)
        self.assertFalse(verify_password("WrongPassword123!", encoded_hash))
        self.assertFalse(verify_password("", encoded_hash))

    def test_verify_password_malformed_hashes(self):
        # Empty or None
        self.assertFalse(verify_password(self.test_password, None))
        self.assertFalse(verify_password(self.test_password, ""))

        # Invalid algorithm
        self.assertFalse(verify_password(self.test_password, "md5$1000$aabb$ccdd"))

        # Too few or too many parts
        self.assertFalse(verify_password(self.test_password, "pbkdf2_sha256$600000$salt"))
        self.assertFalse(verify_password(self.test_password, "pbkdf2_sha256$600000$salt$hash$extra"))

        # Non-numeric or too low iterations
        self.assertFalse(verify_password(self.test_password, "pbkdf2_sha256$not_a_number$0102$0304"))
        self.assertFalse(verify_password(self.test_password, "pbkdf2_sha256$1000$0102$0304"))

        # Invalid hex salt or hash
        self.assertFalse(verify_password(self.test_password, "pbkdf2_sha256$600000$not_hex$0304"))
        self.assertFalse(verify_password(self.test_password, "pbkdf2_sha256$600000$0102$not_hex"))

    def test_create_and_verify_token(self):
        with patch.object(settings, "ADMIN_SECRET_KEY", self.test_secret):
            token, expires_in = create_admin_token("admin_test", expires_in_seconds=3600)
            self.assertIn(".", token)
            self.assertEqual(expires_in, 3600)

            payload = verify_admin_token(token)
            self.assertEqual(payload["sub"], "admin_test")
            self.assertEqual(payload["role"], "admin")
            self.assertIn("jti", payload)
            self.assertIn("iat", payload)
            self.assertIn("exp", payload)

    def test_verify_token_tampered_signature(self):
        with patch.object(settings, "ADMIN_SECRET_KEY", self.test_secret):
            token, _ = create_admin_token("admin_test", expires_in_seconds=3600)
            payload_b64, sig = token.split(".")
            tampered_token = f"{payload_b64}.00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff"

            with self.assertRaises(HTTPException) as ctx:
                verify_admin_token(tampered_token)
            self.assertEqual(ctx.exception.status_code, 401)
            self.assertIn("signature", ctx.exception.detail.lower())

    def test_verify_token_expired(self):
        with patch.object(settings, "ADMIN_SECRET_KEY", self.test_secret):
            # Create a token that expired 10 seconds ago
            token, _ = create_admin_token("admin_test", expires_in_seconds=-10)

            with self.assertRaises(HTTPException) as ctx:
                verify_admin_token(token)
            self.assertEqual(ctx.exception.status_code, 401)
            self.assertIn("expired", ctx.exception.detail.lower())

    def test_verify_token_wrong_role(self):
        import base64
        import hashlib
        import hmac
        import json

        with patch.object(settings, "ADMIN_SECRET_KEY", self.test_secret):
            payload = {
                "sub": "user123",
                "role": "regular_user",
                "iat": int(time.time()),
                "exp": int(time.time()) + 3600,
                "jti": "some-id",
            }
            payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode("utf-8")).decode("ascii").rstrip("=")
            sig = hmac.new(self.test_secret.encode("utf-8"), payload_b64.encode("ascii"), hashlib.sha256).hexdigest()
            token = f"{payload_b64}.{sig}"

            with self.assertRaises(HTTPException) as ctx:
                verify_admin_token(token)
            self.assertEqual(ctx.exception.status_code, 403)


class TestLoginRateLimiter(unittest.TestCase):
    def test_rate_limiter_lockout_and_recovery(self):
        limiter = LoginRateLimiter(max_attempts=3, window_seconds=60, lockout_seconds=30)
        key = "127.0.0.1:admin"

        # Initially not locked
        locked, _ = limiter.is_locked(key)
        self.assertFalse(locked)

        # Attempt 1 & 2 fail
        limiter.record_failure(key)
        limiter.record_failure(key)
        locked, _ = limiter.is_locked(key)
        self.assertFalse(locked)

        # Attempt 3 fails -> should lock out
        is_locked_now, retry_after = limiter.record_failure(key)
        self.assertTrue(is_locked_now)
        self.assertGreaterEqual(retry_after, 25)

        locked, retry = limiter.is_locked(key)
        self.assertTrue(locked)
        self.assertGreaterEqual(retry, 25)

        # Success resets the key
        limiter.record_success(key)
        locked, _ = limiter.is_locked(key)
        self.assertFalse(locked)


if __name__ == "__main__":
    unittest.main()


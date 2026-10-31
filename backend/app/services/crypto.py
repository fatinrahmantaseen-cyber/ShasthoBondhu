import hashlib
import logging
import re
from typing import Optional
from cryptography.fernet import Fernet, InvalidToken
from app.config import settings

logger = logging.getLogger(__name__)


class EncryptionConfigurationError(Exception):
    """Raised when the phone encryption key is missing or malformed."""
    pass


class PhoneCryptoService:
    """Service for encrypting, decrypting, and masking donor phone numbers."""

    _fernet: Optional[Fernet] = None

    @classmethod
    def get_fernet(cls) -> Fernet:
        """Initialize or return the cached Fernet cipher instance."""
        if cls._fernet is None:
            raw_key = settings.DONOR_PHONE_ENCRYPTION_KEY
            if not raw_key or not raw_key.strip():
                raise EncryptionConfigurationError(
                    "DONOR_PHONE_ENCRYPTION_KEY is not configured in backend/.env. "
                    "Generate a valid Fernet key and configure it."
                )
            clean_key = raw_key.strip().encode("utf-8")
            try:
                cls._fernet = Fernet(clean_key)
            except Exception as exc:
                logger.error("Failed to initialize Fernet cipher: %s", type(exc).__name__)
                raise EncryptionConfigurationError(
                    "DONOR_PHONE_ENCRYPTION_KEY is malformed. Key must be a 32-byte url-safe base64-encoded string."
                ) from None
        return cls._fernet

    @classmethod
    def encrypt_phone(cls, phone: str) -> str:
        """Encrypt a raw phone number. Never logs or prints the input phone or ciphertext."""
        if not phone or not phone.strip():
            raise ValueError("Phone number cannot be empty")
        fernet = cls.get_fernet()
        try:
            encrypted_bytes = fernet.encrypt(phone.strip().encode("utf-8"))
            return encrypted_bytes.decode("utf-8")
        except Exception as exc:
            logger.error("Phone encryption failed: %s", type(exc).__name__)
            raise RuntimeError("Failed to securely encrypt phone number") from None

    @classmethod
    def decrypt_phone(cls, encrypted_token: str) -> str:
        """Decrypt an encrypted phone token. Only executed in trusted server-side workflows."""
        if not encrypted_token or not encrypted_token.strip():
            raise ValueError("Encrypted token cannot be empty")
        fernet = cls.get_fernet()
        try:
            decrypted_bytes = fernet.decrypt(encrypted_token.strip().encode("utf-8"))
            return decrypted_bytes.decode("utf-8")
        except InvalidToken:
            logger.warning("Phone decryption failed: InvalidToken")
            raise ValueError("Unable to decrypt phone number: invalid or corrupted cipher token") from None
        except Exception as exc:
            logger.error("Phone decryption failed: %s", type(exc).__name__)
            raise RuntimeError("Unexpected error during phone decryption") from None

    @staticmethod
    def mask_phone(phone: str) -> str:
        """
        Safely generate a standardized masked phone display string.
        Examples:
          01712345482  -> +880 17**-***482
          +8801812345914 -> +880 18**-***914
        """
        digits = re.sub(r"\D", "", phone)
        # Normalize Bangladeshi mobile number
        if digits.startswith("880") and len(digits) >= 13:
            digits = digits[3:]  # Strip country code 880 -> 1712345482
        elif digits.startswith("0") and len(digits) >= 11:
            digits = digits[1:]  # Strip leading zero -> 1712345482

        if len(digits) >= 10:
            operator_prefix = digits[:2]  # e.g. 17, 18, 19, 16, 15, 13, 14
            last_digits = digits[-3:]     # e.g. 482
            return f"+880 {operator_prefix}**-***{last_digits}"

        # Fallback for non-standard lengths: mask intermediate characters
        if len(phone) > 6:
            return f"{phone[:3]}****{phone[-3:]}"
        return "****"

    @staticmethod
    def hash_ip(ip: Optional[str]) -> Optional[str]:
        """Generate a SHA-256 hash of an IP address for privacy-safe consent audit logging."""
        if not ip or not ip.strip():
            return None
        return hashlib.sha256(ip.strip().encode("utf-8")).hexdigest()


import unittest
from app.services.crypto import PhoneCryptoService


class TestPhoneCryptoService(unittest.TestCase):
    def test_encryption_and_decryption_roundtrip(self):
        raw_phone = "01712345482"
        encrypted = PhoneCryptoService.encrypt_phone(raw_phone)
        self.assertNotEqual(raw_phone, encrypted)
        self.assertNotIn(raw_phone, encrypted)

        decrypted = PhoneCryptoService.decrypt_phone(encrypted)
        self.assertEqual(decrypted, raw_phone)

    def test_phone_masking(self):
        cases = [
            ("01712345482", "+880 17**-***482"),
            ("+880 1812-345914", "+880 18**-***914"),
            ("01999999219", "+880 19**-***219"),
            ("01655555651", "+880 16**-***651"),
        ]
        for raw, expected in cases:
            masked = PhoneCryptoService.mask_phone(raw)
            self.assertEqual(masked, expected, f"Failed for {raw}: got {masked}")

    def test_ip_hashing(self):
        ip = "127.0.0.1"
        hashed = PhoneCryptoService.hash_ip(ip)
        self.assertIsNotNone(hashed)
        self.assertEqual(len(hashed), 64)
        self.assertEqual(hashed, PhoneCryptoService.hash_ip(ip))
        self.assertIsNone(PhoneCryptoService.hash_ip(None))
        self.assertIsNone(PhoneCryptoService.hash_ip(""))


if __name__ == "__main__":
    unittest.main()


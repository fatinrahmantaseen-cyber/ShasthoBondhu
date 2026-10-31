"""Unit tests for production configuration constraints, CORS validation, and docs disabling."""

import unittest
from unittest.mock import patch
from pydantic import ValidationError

from app.config import Settings


class TestProductionConfiguration(unittest.TestCase):
    def _create_base_prod_settings(self, **overrides) -> dict:
        base = {
            "ENVIRONMENT": "production",
            "DEBUG": False,
            "DONOR_PHONE_ENCRYPTION_KEY": "dGVzdC1mZXJuZXQta2V5LTMyeWVhcnMtb2xkMTIzNDU2Nzg=",
            "ADMIN_USERNAME": "admin",
            "ADMIN_PASSWORD_HASH": "pbkdf2_sha256$600000$salthex$hashhex",
            "ADMIN_SECRET_KEY": "prod-admin-secret-key-high-entropy-64-bytes-long",
            "CORS_ORIGINS": ["https://shasthobondhu.com", "https://admin.shasthobondhu.com"],
            "ALLOWED_HOSTS": ["shasthobondhu.com", "api.shasthobondhu.com", "testserver"],
        }
        base.update(overrides)
        return base

    def test_development_defaults_are_permissive(self):
        """Development environment allows DEBUG=True and localhost CORS."""
        dev_settings = Settings(
            ENVIRONMENT="development",
            DEBUG=True,
            CORS_ORIGINS=["http://localhost:3000", "http://localhost:3001"],
            ALLOWED_HOSTS=["localhost", "127.0.0.1", "testserver"],
        )
        self.assertEqual(dev_settings.ENVIRONMENT, "development")
        self.assertTrue(dev_settings.DEBUG)
        self.assertIn("http://localhost:3000", dev_settings.CORS_ORIGINS)
        self.assertIn("testserver", dev_settings.ALLOWED_HOSTS)

    def test_production_valid_configuration(self):
        """Production environment passes validation when all security requirements are met."""
        data = self._create_base_prod_settings()
        prod_settings = Settings(**data)
        self.assertEqual(prod_settings.ENVIRONMENT, "production")
        self.assertFalse(prod_settings.DEBUG)
        self.assertIn("https://shasthobondhu.com", prod_settings.CORS_ORIGINS)

    def test_production_rejects_debug_true(self):
        """Production environment strictly requires DEBUG=False."""
        data = self._create_base_prod_settings(DEBUG=True)
        with self.assertRaises(ValidationError) as ctx:
            Settings(**data)
        self.assertIn("DEBUG must be False", str(ctx.exception))

    def test_production_rejects_missing_donor_encryption_key(self):
        """Production requires a non-empty DONOR_PHONE_ENCRYPTION_KEY."""
        data = self._create_base_prod_settings(DONOR_PHONE_ENCRYPTION_KEY=None)
        with self.assertRaises(ValidationError) as ctx:
            Settings(**data)
        self.assertIn("DONOR_PHONE_ENCRYPTION_KEY is required", str(ctx.exception))

    def test_production_rejects_missing_admin_secret(self):
        """Production requires a non-empty ADMIN_SECRET_KEY."""
        data = self._create_base_prod_settings(ADMIN_SECRET_KEY="")
        with self.assertRaises(ValidationError) as ctx:
            Settings(**data)
        self.assertIn("ADMIN_SECRET_KEY is required", str(ctx.exception))

    def test_production_rejects_missing_admin_hash(self):
        """Production requires a non-empty ADMIN_PASSWORD_HASH."""
        data = self._create_base_prod_settings(ADMIN_PASSWORD_HASH=None)
        with self.assertRaises(ValidationError) as ctx:
            Settings(**data)
        self.assertIn("ADMIN_PASSWORD_HASH is required", str(ctx.exception))

    def test_production_rejects_wildcard_cors(self):
        """Production environment forbids wildcard CORS origin."""
        data = self._create_base_prod_settings(CORS_ORIGINS=["*"])
        with self.assertRaises(ValidationError) as ctx:
            Settings(**data)
        self.assertIn("Wildcard CORS origin '*' is forbidden", str(ctx.exception))

    def test_production_rejects_http_cors(self):
        """Production environment forbids unencrypted HTTP CORS origins."""
        data = self._create_base_prod_settings(CORS_ORIGINS=["http://shasthobondhu.com"])
        with self.assertRaises(ValidationError) as ctx:
            Settings(**data)
        self.assertIn("All origins must use HTTPS", str(ctx.exception))

    def test_production_rejects_localhost_cors(self):
        """Production environment forbids localhost CORS origins."""
        data = self._create_base_prod_settings(CORS_ORIGINS=["https://localhost:3000"])
        with self.assertRaises(ValidationError) as ctx:
            Settings(**data)
        self.assertIn("Localhost origins are not permitted in production", str(ctx.exception))

    def test_production_rejects_dev_only_allowed_hosts(self):
        """Production environment requires at least one explicit production domain in ALLOWED_HOSTS."""
        data = self._create_base_prod_settings(ALLOWED_HOSTS=["localhost", "127.0.0.1", "testserver"])
        with self.assertRaises(ValidationError) as ctx:
            Settings(**data)
        self.assertIn("ALLOWED_HOSTS must contain at least one production domain", str(ctx.exception))

    def test_allowed_hosts_string_parsing(self):
        """Comma-separated strings for ALLOWED_HOSTS are parsed correctly."""
        settings = Settings(
            ALLOWED_HOSTS="localhost, 127.0.0.1, api.example.com",
            ENVIRONMENT="development",
        )
        self.assertEqual(settings.ALLOWED_HOSTS, ["localhost", "127.0.0.1", "api.example.com"])

    def test_env_source_allowed_hosts_and_cors_parsing(self):
        """Both JSON array and comma-separated string env vars parse without SettingsError."""
        import os

        # Test comma-separated environment variables
        with patch.dict(os.environ, {
            "ALLOWED_HOSTS": "localhost, 127.0.0.1, testserver",
            "CORS_ORIGINS": "http://localhost:3000, http://localhost:3001",
        }):
            s_csv = Settings(ENVIRONMENT="development")
            self.assertEqual(s_csv.ALLOWED_HOSTS, ["localhost", "127.0.0.1", "testserver"])
            self.assertEqual(s_csv.CORS_ORIGINS, ["http://localhost:3000", "http://localhost:3001"])

        # Test JSON array environment variables
        with patch.dict(os.environ, {
            "ALLOWED_HOSTS": '["localhost", "127.0.0.1", "testserver"]',
            "CORS_ORIGINS": '["http://localhost:3000", "http://localhost:3001"]',
        }):
            s_json = Settings(ENVIRONMENT="development")
            self.assertEqual(s_json.ALLOWED_HOSTS, ["localhost", "127.0.0.1", "testserver"])
            self.assertEqual(s_json.CORS_ORIGINS, ["http://localhost:3000", "http://localhost:3001"])

    def test_production_disables_api_docs_endpoints(self):
        """Production environment sets docs_url, redoc_url, and openapi_url to None."""
        with patch("app.config.settings.ENVIRONMENT", "production"):
            import importlib
            import app.main
            importlib.reload(app.main)
            self.assertIsNone(app.main.app.docs_url)
            self.assertIsNone(app.main.app.redoc_url)
            self.assertIsNone(app.main.app.openapi_url)
            
            # Root route also omits docs link in production
            root_res = app.main.root()
            self.assertNotIn("docs", root_res)

        # Restore development configuration
        with patch("app.config.settings.ENVIRONMENT", "development"):
            importlib.reload(app.main)
            self.assertEqual(app.main.app.docs_url, "/docs")
            self.assertEqual(app.main.app.redoc_url, "/redoc")
            self.assertIsNotNone(app.main.app.openapi_url)
            root_res = app.main.root()
            self.assertIn("docs", root_res)


if __name__ == "__main__":
    unittest.main()

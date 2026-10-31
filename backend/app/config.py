from pathlib import Path
from typing import List, Union
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import URL


class Settings(BaseSettings):
    PROJECT_NAME: str = "ShasthoBondhu API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # CORS origins permitted to access this API
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v  # type: ignore
        return [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3001",
        ]

    # Host header protection / TrustedHostMiddleware configuration
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1", "testserver"]

    @field_validator("ALLOWED_HOSTS", mode="before")
    @classmethod
    def assemble_allowed_hosts(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v  # type: ignore
        return ["localhost", "127.0.0.1", "testserver"]

    # PostgreSQL Database settings
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = ""
    POSTGRES_DB: str = "shasthobondhu"
    DATABASE_URL: str | None = None

    # Application-level symmetric encryption key for donor phone numbers
    DONOR_PHONE_ENCRYPTION_KEY: str | None = None

    # Administrator Authentication Settings
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD_HASH: str | None = None
    ADMIN_SECRET_KEY: str | None = None
    ADMIN_TOKEN_EXPIRE_MINUTES: int = 120

    @property
    def sqlalchemy_database_url(self) -> Union[str, URL]:
        # If POSTGRES_PASSWORD is provided, build safely via URL.create to handle special characters (@, :, /, #, %)
        if self.POSTGRES_PASSWORD and self.POSTGRES_PASSWORD.strip():
            return URL.create(
                drivername="postgresql+psycopg",
                username=self.POSTGRES_USER,
                password=self.POSTGRES_PASSWORD,
                host=self.POSTGRES_SERVER,
                port=self.POSTGRES_PORT,
                database=self.POSTGRES_DB,
            )
        if self.DATABASE_URL and self.DATABASE_URL.strip():
            return self.DATABASE_URL
        return URL.create(
            drivername="postgresql+psycopg",
            username=self.POSTGRES_USER,
            password=None,
            host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT,
            database=self.POSTGRES_DB,
        )

    @model_validator(mode="after")
    def validate_production_configuration(self) -> "Settings":
        """Strictly enforce security constraints in production while preserving local development."""
        env = (self.ENVIRONMENT or "").strip().lower()
        if env == "production":
            if self.DEBUG:
                raise ValueError("Insecure configuration: DEBUG must be False when ENVIRONMENT is 'production'.")
            if not self.DONOR_PHONE_ENCRYPTION_KEY or not self.DONOR_PHONE_ENCRYPTION_KEY.strip():
                raise ValueError("Insecure configuration: DONOR_PHONE_ENCRYPTION_KEY is required in production.")
            if not self.ADMIN_SECRET_KEY or not self.ADMIN_SECRET_KEY.strip():
                raise ValueError("Insecure configuration: ADMIN_SECRET_KEY is required in production.")
            if not self.ADMIN_PASSWORD_HASH or not self.ADMIN_PASSWORD_HASH.strip():
                raise ValueError("Insecure configuration: ADMIN_PASSWORD_HASH is required in production.")

            # Validate CORS origins: disallow wildcards, insecure HTTP, and localhost in production
            if not self.CORS_ORIGINS or any(origin == "*" for origin in self.CORS_ORIGINS):
                raise ValueError("Insecure configuration: Wildcard CORS origin '*' is forbidden in production.")
            for origin in self.CORS_ORIGINS:
                if not origin.startswith("https://"):
                    raise ValueError(f"Insecure CORS origin in production: '{origin}'. All origins must use HTTPS.")
                origin_lower = origin.lower()
                if "localhost" in origin_lower or "127.0.0.1" in origin_lower:
                    raise ValueError(f"Insecure CORS origin in production: '{origin}'. Localhost origins are not permitted in production.")

            # Validate ALLOWED_HOSTS in production
            if not self.ALLOWED_HOSTS:
                raise ValueError("Insecure configuration: ALLOWED_HOSTS must be configured in production.")
            dev_only_hosts = {"localhost", "127.0.0.1", "::1"}
            prod_hosts = [h for h in self.ALLOWED_HOSTS if h.lower() not in dev_only_hosts and h.lower() != "testserver"]
            if not prod_hosts:
                raise ValueError(
                    "Insecure configuration: ALLOWED_HOSTS must contain at least one production domain or hostname when ENVIRONMENT is 'production'."
                )
        return self

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()


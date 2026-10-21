import logging
from typing import Generator, Tuple
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()

# Initialize SQLAlchemy engine with pool pre-ping
engine = create_engine(
    settings.sqlalchemy_database_url,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator:
    """Dependency provider for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> Tuple[bool, str]:
    """Verify live PostgreSQL connectivity without throwing unhandled exceptions."""
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            row = result.fetchone()
            if row and row[0] == 1:
                return True, "PostgreSQL connection active and responding."
            return False, "Unexpected database response."
    except Exception as exc:
        logger.warning(f"Database connection check failed: {exc}")
        # Return generic safe message without exposing sensitive credentials
        return False, f"Connection failed: {type(exc).__name__}"

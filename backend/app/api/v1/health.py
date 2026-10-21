from datetime import datetime, timezone
from fastapi import APIRouter
from app.config import settings
from app.db.session import check_db_connection

router = APIRouter()


@router.get("/health", summary="System Health & Database Connectivity Check")
def get_health():
    """Verify application uptime and live PostgreSQL connectivity."""
    db_connected, db_message = check_db_connection()

    return {
        "status": "healthy" if db_connected else "degraded",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": {
          "connected": db_connected,
          "message": db_message,
          "host": settings.POSTGRES_SERVER,
          "port": settings.POSTGRES_PORT,
          "database": settings.POSTGRES_DB,
        },
    }

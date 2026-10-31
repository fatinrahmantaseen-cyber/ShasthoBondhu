from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from app.config import settings
from app.api.v1.health import router as health_router
from app.api.v1.donors import router as donors_router
from app.api.v1.blood_requests import router as blood_requests_router
from app.api.v1.hospitals import router as hospitals_router
from app.api.v1.doctors import router as doctors_router
from app.api.v1.pharmacies import router as pharmacies_router
from app.api.v1.admin import router as admin_router
from app.services.crypto import PhoneCryptoService

logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("shasthobondhu.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION} [{settings.ENVIRONMENT}]")
    logger.info(f"CORS origins configured: {settings.CORS_ORIGINS}")
    # Validate cryptographic service configuration at startup
    PhoneCryptoService.get_fernet()
    logger.info("Donor phone encryption service initialized and key validated.")
    yield
    logger.info(f"Shutting down {settings.PROJECT_NAME}")


is_production = settings.ENVIRONMENT.lower() == "production"

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for ShasthoBondhu (স্বাস্থ্যবন্ধু) healthcare assistance platform in Bangladesh.",
    openapi_url=None if is_production else f"{settings.API_V1_STR}/openapi.json",
    docs_url=None if is_production else "/docs",
    redoc_url=None if is_production else "/redoc",
    lifespan=lifespan,
)

# Explicit CORS configuration for the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Host header protection / HTTP Host header attack prevention
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS,
)

# Include v1 API endpoints
app.include_router(health_router, prefix=settings.API_V1_STR, tags=["Health"])
app.include_router(donors_router, prefix=settings.API_V1_STR)
app.include_router(blood_requests_router, prefix=settings.API_V1_STR)
app.include_router(hospitals_router, prefix=settings.API_V1_STR)
app.include_router(doctors_router, prefix=settings.API_V1_STR)
app.include_router(pharmacies_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)


@app.get("/", summary="Root API Index")
def root():
    resp = {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "health": f"{settings.API_V1_STR}/health",
    }
    if not is_production:
        resp["docs"] = "/docs"
    return resp


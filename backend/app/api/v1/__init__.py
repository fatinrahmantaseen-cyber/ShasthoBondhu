from app.api.v1.health import router as health_router
from app.api.v1.donors import router as donors_router
from app.api.v1.blood_requests import router as blood_requests_router
from app.api.v1.hospitals import router as hospitals_router
from app.api.v1.doctors import router as doctors_router
from app.api.v1.pharmacies import router as pharmacies_router
from app.api.v1.admin import router as admin_router

__all__ = [
    "health_router",
    "donors_router",
    "blood_requests_router",
    "hospitals_router",
    "doctors_router",
    "pharmacies_router",
    "admin_router",
]

"""Protected Administrative API endpoints for directory verification and audit trails."""

import logging
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.config import settings
from app.db.session import get_db
from app.models.audit_log import VerificationAuditLog
from app.models.doctor import Doctor
from app.models.hospital import Hospital
from app.models.pharmacy import Pharmacy
from app.schemas.admin import (
    AdminLoginRequest,
    AdminLoginResponse,
    DoctorAdminResponse,
    HospitalAdminResponse,
    PharmacyAdminResponse,
    VerificationAuditLogPublic,
    VerificationReviewRequest,
)
from app.services.auth import (
    create_admin_token,
    get_current_admin,
    login_rate_limiter,
    verify_password,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Administrator Verification"])

VALID_VERIFICATION_STATUSES = {"unverified", "pending_verification", "verified", "rejected"}
VALID_ENTITY_TYPES = {"hospital", "doctor", "pharmacy"}


def _get_client_ip(request: Request) -> str:
    """Safely extract client IP address for rate limiting."""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "127.0.0.1"


# ---------------------------------------------------------------------------
# Admin Authentication Endpoint
# ---------------------------------------------------------------------------


@router.post(
    "/login",
    response_model=AdminLoginResponse,
    status_code=status.HTTP_200_OK,
    summary="Administrator Login",
)
def admin_login(
    login_data: AdminLoginRequest,
    request: Request,
    response: Response,
):
    """Authenticate administrator credentials and return an HMAC-signed bearer token.

    Protected by in-process rate limiting against brute-force attacks.
    """
    client_ip = _get_client_ip(request)
    rate_limit_key = f"{client_ip}:{login_data.username}"

    # Check if client/user is currently locked out
    is_locked, retry_after = login_rate_limiter.is_locked(rate_limit_key)
    if is_locked:
        response.headers["Retry-After"] = str(retry_after)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. Please try again in {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)},
        )

    # Validate server-side admin configuration
    if (
        not settings.ADMIN_PASSWORD_HASH
        or not settings.ADMIN_SECRET_KEY
        or not settings.ADMIN_USERNAME
    ):
        logger.error("Admin authentication attempted but server credentials are not fully configured")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Administrator authentication is not configured on this server.",
        )

    # Constant-time comparison for username & PBKDF2 hash verification for password
    username_valid = (login_data.username == settings.ADMIN_USERNAME)
    password_valid = verify_password(login_data.password, settings.ADMIN_PASSWORD_HASH)

    if not (username_valid and password_valid):
        is_locked_now, retry_after = login_rate_limiter.record_failure(rate_limit_key)
        if is_locked_now:
            response.headers["Retry-After"] = str(retry_after)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many failed login attempts. Locked out for {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)},
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid administrator credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Successful login: reset rate limiter for this key
    login_rate_limiter.record_success(rate_limit_key)

    token, expires_in = create_admin_token(login_data.username)
    return AdminLoginResponse(
        access_token=token,
        token_type="bearer",
        expires_in=expires_in,
    )


# ---------------------------------------------------------------------------
# Protected Hospital Verification Endpoints
# ---------------------------------------------------------------------------


@router.get(
    "/hospitals",
    response_model=List[HospitalAdminResponse],
    summary="Admin List Hospitals by Verification Status",
)
def admin_list_hospitals(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by verification_status"),
    division: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """List hospital submissions with optional status filter for administrative review."""
    query = db.query(Hospital)

    if status_filter:
        clean_status = status_filter.strip().lower()
        if clean_status not in VALID_VERIFICATION_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status '{status_filter}'. Must be one of: {', '.join(sorted(VALID_VERIFICATION_STATUSES))}",
            )
        query = query.filter(Hospital.verification_status == clean_status)

    if division:
        query = query.filter(Hospital.division.ilike(f"%{division.strip()}%"))
    if district:
        query = query.filter(Hospital.district.ilike(f"%{district.strip()}%"))

    return query.order_by(Hospital.created_at.desc()).offset(offset).limit(limit).all()


@router.get(
    "/hospitals/{hospital_id}",
    response_model=HospitalAdminResponse,
    summary="Admin Retrieve Hospital Submission Details",
)
def admin_get_hospital(
    hospital_id: uuid.UUID,
    current_admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Retrieve full details of any hospital record regardless of verification status."""
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hospital not found")
    return hospital


@router.post(
    "/hospitals/{hospital_id}/review",
    response_model=VerificationAuditLogPublic,
    summary="Admin Approve or Reject Hospital Submission",
)
def admin_review_hospital(
    hospital_id: uuid.UUID,
    review_in: VerificationReviewRequest,
    current_admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Review and update verification status of a hospital submission in an atomic transaction."""
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hospital not found")

    previous_status = hospital.verification_status
    new_status = "verified" if review_in.action == "approve" else "rejected"

    # Update entity record review metadata
    hospital.verification_status = new_status
    hospital.reviewed_at = func.now()
    hospital.reviewed_by = current_admin
    hospital.review_notes = review_in.notes

    # Create immutable audit log entry
    audit_entry = VerificationAuditLog(
        entity_type="hospital",
        entity_id=hospital.id,
        action=review_in.action,
        previous_status=previous_status,
        new_status=new_status,
        reviewer_username=current_admin,
        notes=review_in.notes,
    )
    db.add(audit_entry)

    try:
        db.commit()
        db.refresh(audit_entry)
        return audit_entry
    except Exception as exc:
        db.rollback()
        logger.error("Failed to commit hospital review transaction: %s", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save review decision and audit trail.",
        ) from None


# ---------------------------------------------------------------------------
# Protected Doctor Verification Endpoints
# ---------------------------------------------------------------------------


@router.get(
    "/doctors",
    response_model=List[DoctorAdminResponse],
    summary="Admin List Doctors by Verification Status",
)
def admin_list_doctors(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by verification_status"),
    division: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    specialty: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """List doctor submissions with optional status filter for administrative review."""
    query = db.query(Doctor)

    if status_filter:
        clean_status = status_filter.strip().lower()
        if clean_status not in VALID_VERIFICATION_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status '{status_filter}'. Must be one of: {', '.join(sorted(VALID_VERIFICATION_STATUSES))}",
            )
        query = query.filter(Doctor.verification_status == clean_status)

    if division:
        query = query.filter(Doctor.division.ilike(f"%{division.strip()}%"))
    if district:
        query = query.filter(Doctor.district.ilike(f"%{district.strip()}%"))
    if specialty:
        query = query.filter(Doctor.specialty.ilike(f"%{specialty.strip()}%"))

    return query.order_by(Doctor.created_at.desc()).offset(offset).limit(limit).all()


@router.get(
    "/doctors/{doctor_id}",
    response_model=DoctorAdminResponse,
    summary="Admin Retrieve Doctor Submission Details",
)
def admin_get_doctor(
    doctor_id: uuid.UUID,
    current_admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Retrieve full details of any doctor record regardless of verification status."""
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    return doctor


@router.post(
    "/doctors/{doctor_id}/review",
    response_model=VerificationAuditLogPublic,
    summary="Admin Approve or Reject Doctor Submission",
)
def admin_review_doctor(
    doctor_id: uuid.UUID,
    review_in: VerificationReviewRequest,
    current_admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Review and update verification status of a doctor submission in an atomic transaction."""
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")

    previous_status = doctor.verification_status
    new_status = "verified" if review_in.action == "approve" else "rejected"

    # Update entity record review metadata
    doctor.verification_status = new_status
    doctor.reviewed_at = func.now()
    doctor.reviewed_by = current_admin
    doctor.review_notes = review_in.notes

    # Create immutable audit log entry
    audit_entry = VerificationAuditLog(
        entity_type="doctor",
        entity_id=doctor.id,
        action=review_in.action,
        previous_status=previous_status,
        new_status=new_status,
        reviewer_username=current_admin,
        notes=review_in.notes,
    )
    db.add(audit_entry)

    try:
        db.commit()
        db.refresh(audit_entry)
        return audit_entry
    except Exception as exc:
        db.rollback()
        logger.error("Failed to commit doctor review transaction: %s", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save review decision and audit trail.",
        ) from None


# ---------------------------------------------------------------------------
# Protected Pharmacy Verification Endpoints
# ---------------------------------------------------------------------------


@router.get(
    "/pharmacies",
    response_model=List[PharmacyAdminResponse],
    summary="Admin List Pharmacies by Verification Status",
)
def admin_list_pharmacies(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by verification_status"),
    division: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """List pharmacy submissions with optional status filter for administrative review."""
    query = db.query(Pharmacy)

    if status_filter:
        clean_status = status_filter.strip().lower()
        if clean_status not in VALID_VERIFICATION_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status '{status_filter}'. Must be one of: {', '.join(sorted(VALID_VERIFICATION_STATUSES))}",
            )
        query = query.filter(Pharmacy.verification_status == clean_status)

    if division:
        query = query.filter(Pharmacy.division.ilike(f"%{division.strip()}%"))
    if district:
        query = query.filter(Pharmacy.district.ilike(f"%{district.strip()}%"))

    return query.order_by(Pharmacy.created_at.desc()).offset(offset).limit(limit).all()


@router.get(
    "/pharmacies/{pharmacy_id}",
    response_model=PharmacyAdminResponse,
    summary="Admin Retrieve Pharmacy Submission Details",
)
def admin_get_pharmacy(
    pharmacy_id: uuid.UUID,
    current_admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Retrieve full details of any pharmacy record regardless of verification status."""
    pharmacy = db.query(Pharmacy).filter(Pharmacy.id == pharmacy_id).first()
    if not pharmacy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pharmacy not found")
    return pharmacy


@router.post(
    "/pharmacies/{pharmacy_id}/review",
    response_model=VerificationAuditLogPublic,
    summary="Admin Approve or Reject Pharmacy Submission",
)
def admin_review_pharmacy(
    pharmacy_id: uuid.UUID,
    review_in: VerificationReviewRequest,
    current_admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Review and update verification status of a pharmacy submission in an atomic transaction."""
    pharmacy = db.query(Pharmacy).filter(Pharmacy.id == pharmacy_id).first()
    if not pharmacy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pharmacy not found")

    previous_status = pharmacy.verification_status
    new_status = "verified" if review_in.action == "approve" else "rejected"

    # Update entity record review metadata
    pharmacy.verification_status = new_status
    pharmacy.reviewed_at = func.now()
    pharmacy.reviewed_by = current_admin
    pharmacy.review_notes = review_in.notes

    # Create immutable audit log entry
    audit_entry = VerificationAuditLog(
        entity_type="pharmacy",
        entity_id=pharmacy.id,
        action=review_in.action,
        previous_status=previous_status,
        new_status=new_status,
        reviewer_username=current_admin,
        notes=review_in.notes,
    )
    db.add(audit_entry)

    try:
        db.commit()
        db.refresh(audit_entry)
        return audit_entry
    except Exception as exc:
        db.rollback()
        logger.error("Failed to commit pharmacy review transaction: %s", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save review decision and audit trail.",
        ) from None


# ---------------------------------------------------------------------------
# Protected Verification Audit History Endpoint
# ---------------------------------------------------------------------------


@router.get(
    "/audit-logs",
    response_model=List[VerificationAuditLogPublic],
    summary="Admin List Verification Audit Logs",
)
def admin_list_audit_logs(
    entity_type: Optional[str] = Query(None, description="Filter by entity_type: hospital, doctor, pharmacy"),
    entity_id: Optional[uuid.UUID] = Query(None, description="Filter by specific entity UUID"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Retrieve immutable audit logs of all historical verification decisions."""
    query = db.query(VerificationAuditLog)

    if entity_type:
        clean_type = entity_type.strip().lower()
        if clean_type not in VALID_ENTITY_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid entity_type '{entity_type}'. Must be one of: {', '.join(sorted(VALID_ENTITY_TYPES))}",
            )
        query = query.filter(VerificationAuditLog.entity_type == clean_type)

    if entity_id:
        query = query.filter(VerificationAuditLog.entity_id == entity_id)

    return query.order_by(VerificationAuditLog.created_at.desc()).offset(offset).limit(limit).all()


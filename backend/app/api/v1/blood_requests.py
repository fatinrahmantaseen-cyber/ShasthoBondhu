import logging
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.blood_request import BloodRequest
from app.schemas.blood_request import (
    BloodRequestCreate,
    BloodRequestPublic,
    VALID_BLOOD_GROUPS,
    VALID_REQUEST_STATUSES,
)
from app.services.crypto import PhoneCryptoService, EncryptionConfigurationError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/blood-requests", tags=["Blood Requests"])


@router.post(
    "",
    response_model=BloodRequestPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Create an Emergency Blood Request",
)
def create_blood_request(
    request_in: BloodRequestCreate,
    db: Session = Depends(get_db),
):
    """
    Submit a blood request with encrypted contact information and privacy-first masking.
    
    Privacy guarantees:
    - Requester contact phone number is encrypted at rest using authenticated symmetric encryption.
    - Public profiles only return masked contact numbers (+880 17**-***890).
    - Initial request status is always safely assigned to 'pending'.
    - Plaintext phone numbers and encryption keys are never logged or returned in responses.
    """
    clean_bg = request_in.blood_group.strip().upper()
    if clean_bg not in VALID_BLOOD_GROUPS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid blood group '{request_in.blood_group}'. Must be one of: {', '.join(sorted(VALID_BLOOD_GROUPS))}",
        )

    if request_in.units_required <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="units_required must be a positive integer greater than zero.",
        )

    # Encrypt raw contact phone and generate masked display string
    try:
        phone_masked = PhoneCryptoService.mask_phone(request_in.contact_phone)
        phone_encrypted = PhoneCryptoService.encrypt_phone(request_in.contact_phone)
    except EncryptionConfigurationError as exc:
        logger.error("Phone encryption configuration error: %s", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Secure storage service is currently unavailable. Please contact support.",
        ) from None
    except Exception as exc:
        logger.error("Contact phone encryption failure: %s", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while securing contact details.",
        ) from None

    new_request = BloodRequest(
        blood_group=clean_bg,
        division=request_in.division.strip(),
        district=request_in.district.strip(),
        upazila=request_in.upazila.strip(),
        units_required=request_in.units_required,
        required_by=request_in.required_by,
        hospital_name=request_in.hospital_name.strip(),
        medical_reason=request_in.medical_reason.strip() if request_in.medical_reason else None,
        additional_notes=request_in.additional_notes.strip() if request_in.additional_notes else None,
        request_status="pending",
        contact_name=request_in.contact_name.strip(),
        contact_phone_masked=phone_masked,
        contact_phone_encrypted=phone_encrypted,
        is_demo=False,
    )

    try:
        db.add(new_request)
        db.commit()
        db.refresh(new_request)
    except Exception as exc:
        db.rollback()
        logger.error("Database error saving blood request: %s", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register blood request in database.",
        ) from None

    return new_request


@router.get(
    "",
    response_model=List[BloodRequestPublic],
    summary="List Public Blood Requests",
)
def list_blood_requests(
    blood_group: Optional[str] = Query(None, description="Filter by blood group (e.g. A+, B+, O+)"),
    division: Optional[str] = Query(None, description="Filter by division (e.g. Dhaka, Chittagong)"),
    district: Optional[str] = Query(None, description="Filter by district (e.g. Dhaka, Sylhet)"),
    upazila: Optional[str] = Query(None, description="Filter by upazila (e.g. Mirpur, Dhanmondi)"),
    request_status: Optional[str] = Query("pending", description="Filter by status: pending, in_progress, fulfilled, cancelled, expired, or all"),
    limit: int = Query(20, ge=1, le=100, description="Page limit (max 100)"),
    offset: int = Query(0, ge=0, description="Page offset"),
    db: Session = Depends(get_db),
):
    """
    Retrieve public blood requests with location, blood group, and status filters.
    All contact phone numbers are strictly masked (+880 17**-***890) for privacy.
    """
    query = db.query(BloodRequest)

    if blood_group and blood_group.strip():
        # URL query parsers decode '+' to ' ' (e.g. ?blood_group=A+ -> 'A ')
        clean_bg = blood_group.replace(" ", "+").strip().upper()
        if clean_bg in VALID_BLOOD_GROUPS:
            query = query.filter(BloodRequest.blood_group == clean_bg)

    if division and division.strip() and division.strip().lower() != "all":
        query = query.filter(func.lower(BloodRequest.division) == division.strip().lower())

    if district and district.strip() and district.strip().lower() != "all":
        query = query.filter(func.lower(BloodRequest.district) == district.strip().lower())

    if upazila and upazila.strip():
        query = query.filter(func.lower(BloodRequest.upazila).ilike(f"%{upazila.strip().lower()}%"))

    if request_status and request_status.strip().lower() != "all":
        clean_status = request_status.strip().lower()
        if clean_status not in VALID_REQUEST_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid request status '{request_status}'. Must be one of: {', '.join(sorted(VALID_REQUEST_STATUSES))} or 'all'",
            )
        query = query.filter(BloodRequest.request_status == clean_status)

    query = query.order_by(BloodRequest.required_by.asc(), BloodRequest.created_at.desc()).offset(offset).limit(limit)
    return query.all()


@router.get(
    "/{request_id}",
    response_model=BloodRequestPublic,
    summary="Get Public Blood Request by ID",
)
def get_blood_request(
    request_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """
    Retrieve public details of a blood request by its UUID.
    Returns HTTP 404 if not found.
    Excludes all raw or encrypted contact data.
    """
    blood_req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not blood_req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood request not found.",
        )
    return blood_req


import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.donor import Donor
from app.schemas.donor import DonorCreate, DonorPublic, VALID_BLOOD_GROUPS
from app.services.crypto import PhoneCryptoService, EncryptionConfigurationError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/donors", tags=["Blood Donors"])


def get_client_ip(request: Request) -> Optional[str]:
    """Extract client IP safely from forwarded headers or direct connection."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        # First IP in X-Forwarded-For is client origin
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return None


@router.post(
    "",
    response_model=DonorPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Register a Voluntary Blood Donor",
)
def register_donor(
    donor_in: DonorCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Register a voluntary blood donor with explicit server-side consent validation.
    
    Privacy guarantees:
    - Raw phone number is encrypted with authenticated symmetric encryption before database storage.
    - Public profiles only show masked phone numbers (+880 17**-***482).
    - Consent IP is one-way SHA-256 hashed for privacy-safe audit logging.
    - Public responses never expose raw phone numbers, encryption keys, or hashes.
    """
    # Explicit server-side consent check (do not rely on client-side validation alone)
    if not donor_in.consent_given:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Explicit voluntary consent is required to register as a donor.",
        )

    clean_blood_group = donor_in.blood_group.strip().upper()
    if clean_blood_group not in VALID_BLOOD_GROUPS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid blood group '{donor_in.blood_group}'. Must be one of: {', '.join(sorted(VALID_BLOOD_GROUPS))}",
        )

    # Encrypt raw phone and create masked display string
    try:
        phone_masked = PhoneCryptoService.mask_phone(donor_in.phone)
        phone_encrypted = PhoneCryptoService.encrypt_phone(donor_in.phone)
    except EncryptionConfigurationError as exc:
        logger.error("Encryption service configuration failure: %s", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Secure storage service is currently misconfigured. Please contact support.",
        ) from None
    except Exception as exc:
        logger.error("Phone encryption processing failure: %s", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while securing donor contact details.",
        ) from None

    # Capture privacy-safe audit hash of client IP
    client_ip = get_client_ip(request)
    consent_ip_hash = PhoneCryptoService.hash_ip(client_ip)
    now_utc = datetime.now(timezone.utc)

    new_donor = Donor(
        name=donor_in.name.strip(),
        blood_group=clean_blood_group,
        division=donor_in.division.strip(),
        district=donor_in.district.strip(),
        upazila=donor_in.upazila.strip(),
        area=donor_in.area.strip() if donor_in.area else None,
        email=donor_in.email.strip() if donor_in.email else None,
        phone_masked=phone_masked,
        phone_encrypted=phone_encrypted,
        is_available=True,
        total_donations=0,
        consent_given=True,
        consent_timestamp=now_utc,
        consent_ip_hash=consent_ip_hash,
        is_demo=False,
    )

    try:
        db.add(new_donor)
        db.commit()
        db.refresh(new_donor)
    except Exception as exc:
        db.rollback()
        logger.error("Database error creating donor record: %s", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register donor in database.",
        ) from None

    return new_donor


@router.get(
    "",
    response_model=List[DonorPublic],
    summary="Search Public Blood Donor Directory",
)
def list_donors(
    blood_group: Optional[str] = Query(None, description="Filter by blood group (e.g. A+, B+, O+)"),
    division: Optional[str] = Query(None, description="Filter by division (e.g. Dhaka, Chittagong)"),
    district: Optional[str] = Query(None, description="Filter by district (e.g. Dhaka, Comilla)"),
    upazila: Optional[str] = Query(None, description="Filter by upazila (e.g. Dhanmondi, Mirpur)"),
    is_available: Optional[bool] = Query(True, description="Filter by active availability"),
    limit: int = Query(20, ge=1, le=100, description="Page limit"),
    offset: int = Query(0, ge=0, description="Page offset"),
    db: Session = Depends(get_db),
):
    """
    Search available voluntary blood donors with location and blood group filters.
    All returned contact numbers are strictly masked for privacy (+880 17**-***482).
    """
    query = db.query(Donor)

    if blood_group and blood_group.strip():
        # URL query parsers decode '+' to ' ' (e.g., ?blood_group=A+ -> 'A ')
        clean_bg = blood_group.replace(" ", "+").strip().upper()
        if clean_bg in VALID_BLOOD_GROUPS:
            query = query.filter(Donor.blood_group == clean_bg)

    if division and division.strip() and division.strip().lower() != "all":
        query = query.filter(func.lower(Donor.division) == division.strip().lower())

    if district and district.strip() and district.strip().lower() != "all":
        query = query.filter(func.lower(Donor.district) == district.strip().lower())

    if upazila and upazila.strip():
        query = query.filter(func.lower(Donor.upazila).ilike(f"%{upazila.strip().lower()}%"))

    if is_available is not None:
        query = query.filter(Donor.is_available == is_available)

    query = query.order_by(Donor.created_at.desc()).offset(offset).limit(limit)
    return query.all()


@router.get(
    "/{donor_id}",
    response_model=DonorPublic,
    summary="Get Public Donor Profile by ID",
)
def get_donor(
    donor_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """
    Retrieve public details of a voluntary donor by their UUID.
    Sensitive data (raw phone, encryption keys, consent hash) is never exposed.
    """
    donor = db.query(Donor).filter(Donor.id == donor_id).first()
    if not donor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donor profile not found.",
        )
    return donor

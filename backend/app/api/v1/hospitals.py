import logging
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, cast, String
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.hospital import Hospital
from app.schemas.hospital import (
    HospitalCreate,
    HospitalResponse,
    VALID_CLASSIFICATIONS,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/hospitals", tags=["Hospitals & Healthcare Facilities"])


@router.post(
    "",
    response_model=HospitalResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a Healthcare Facility",
)
def create_hospital(
    hospital_in: HospitalCreate,
    db: Session = Depends(get_db),
):
    """
    Register a hospital or healthcare facility.
    New facilities are initially registered with 'unverified' status.
    """
    clean_classification = hospital_in.classification.strip()
    if clean_classification not in VALID_CLASSIFICATIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid classification '{hospital_in.classification}'. Must be one of: {', '.join(sorted(VALID_CLASSIFICATIONS))}",
        )

    new_hospital = Hospital(
        name=hospital_in.name.strip(),
        name_bn=hospital_in.name_bn.strip() if hospital_in.name_bn else None,
        classification=clean_classification,
        division=hospital_in.division.strip(),
        district=hospital_in.district.strip(),
        upazila=hospital_in.upazila.strip(),
        address=hospital_in.address.strip(),
        address_bn=hospital_in.address_bn.strip() if hospital_in.address_bn else None,
        public_contact=hospital_in.public_contact.strip(),
        emergency_hotline=hospital_in.emergency_hotline.strip() if hospital_in.emergency_hotline else None,
        available_services=hospital_in.available_services,
        has_icu=hospital_in.has_icu,
        has_emergency=hospital_in.has_emergency,
        has_dialysis=hospital_in.has_dialysis,
        verification_status="unverified",
        is_demo=False,
    )

    try:
        db.add(new_hospital)
        db.commit()
        db.refresh(new_hospital)
    except Exception as exc:
        db.rollback()
        logger.error("Database error creating hospital record: %s", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register hospital facility in database.",
        ) from None

    return new_hospital


@router.get(
    "",
    response_model=List[HospitalResponse],
    summary="Search Hospital & Healthcare Facility Directory",
)
def list_hospitals(
    division: Optional[str] = Query(None, description="Filter by division (e.g. Dhaka, Chittagong)"),
    district: Optional[str] = Query(None, description="Filter by district (e.g. Dhaka, Comilla)"),
    upazila: Optional[str] = Query(None, description="Filter by upazila (e.g. Dhanmondi, Mirpur)"),
    classification: Optional[str] = Query(None, description="Filter by classification (Government, Private, etc.)"),
    has_icu: Optional[bool] = Query(None, description="Filter for ICU facilities"),
    has_emergency: Optional[bool] = Query(None, description="Filter for 24/7 emergency services"),
    has_dialysis: Optional[bool] = Query(None, description="Filter for dialysis units"),
    service: Optional[str] = Query(None, description="Filter by service keyword"),
    search: Optional[str] = Query(None, description="Search term matching name, address, or district"),
    limit: int = Query(20, ge=1, le=100, description="Page limit"),
    offset: int = Query(0, ge=0, description="Page offset"),
    db: Session = Depends(get_db),
):
    """
    Query hospital and healthcare facility directory with flexible location and capability filters.
    Only officially verified facilities are listed in public searches.
    """
    query = db.query(Hospital).filter(Hospital.verification_status == "verified")

    if division and division.strip() and division.strip().lower() != "all":
        query = query.filter(func.lower(Hospital.division) == division.strip().lower())

    if district and district.strip() and district.strip().lower() != "all":
        query = query.filter(func.lower(Hospital.district) == district.strip().lower())

    if upazila and upazila.strip():
        query = query.filter(func.lower(Hospital.upazila).ilike(f"%{upazila.strip().lower()}%"))

    if classification and classification.strip() and classification.strip().lower() != "all":
        query = query.filter(func.lower(Hospital.classification) == classification.strip().lower())

    if has_icu is not None:
        query = query.filter(Hospital.has_icu == has_icu)

    if has_emergency is not None:
        query = query.filter(Hospital.has_emergency == has_emergency)

    if has_dialysis is not None:
        query = query.filter(Hospital.has_dialysis == has_dialysis)

    if service and service.strip() and service.strip().lower() != "all":
        srv = service.strip().lower()
        query = query.filter(cast(Hospital.available_services, String).ilike(f"%{srv}%"))

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(Hospital.name).ilike(term),
                func.lower(Hospital.name_bn).ilike(term),
                func.lower(Hospital.address).ilike(term),
                func.lower(Hospital.district).ilike(term),
                func.lower(Hospital.upazila).ilike(term),
                cast(Hospital.available_services, String).ilike(term),
            )
        )

    query = query.order_by(Hospital.created_at.desc()).offset(offset).limit(limit)
    return query.all()


@router.get(
    "/{hospital_id}",
    response_model=HospitalResponse,
    summary="Get Hospital Details by ID",
)
def get_hospital(
    hospital_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """
    Retrieve hospital details by facility UUID.
    Unpublished unverified facilities are not exposed and return 404.
    """
    hospital = (
        db.query(Hospital)
        .filter(Hospital.id == hospital_id, Hospital.verification_status == "verified")
        .first()
    )
    if not hospital:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hospital facility not found.",
        )
    return hospital


import logging
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.pharmacy import Pharmacy
from app.schemas.pharmacy import PharmacyCreate, PharmacyResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/pharmacies", tags=["Pharmacies & Dispensaries"])


@router.post(
    "",
    response_model=PharmacyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a Licensed Pharmacy or Dispensary",
)
def create_pharmacy(
    pharmacy_in: PharmacyCreate,
    db: Session = Depends(get_db),
):
    """
    Register a pharmacy or dispensary.
    New pharmacies are assigned 'unverified' status until verified against DGDA drug license records.
    """
    new_pharmacy = Pharmacy(
        name=pharmacy_in.name.strip(),
        name_bn=pharmacy_in.name_bn.strip() if pharmacy_in.name_bn else None,
        division=pharmacy_in.division.strip(),
        district=pharmacy_in.district.strip(),
        upazila=pharmacy_in.upazila.strip(),
        address=pharmacy_in.address.strip(),
        address_bn=pharmacy_in.address_bn.strip() if pharmacy_in.address_bn else None,
        public_contact=pharmacy_in.public_contact.strip(),
        is_open_24_hours=pharmacy_in.is_open_24_hours,
        opening_hours=pharmacy_in.opening_hours.strip() if pharmacy_in.opening_hours else None,
        available_services=pharmacy_in.available_services,
        drug_license_number=pharmacy_in.drug_license_number.strip() if pharmacy_in.drug_license_number else None,
        verification_status="unverified",
        is_demo=False,
    )

    try:
        db.add(new_pharmacy)
        db.commit()
        db.refresh(new_pharmacy)
    except Exception as exc:
        db.rollback()
        logger.error("Database error creating pharmacy record: %s", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register pharmacy in database.",
        ) from None

    return new_pharmacy


@router.get(
    "",
    response_model=List[PharmacyResponse],
    summary="Search Licensed Pharmacy & Dispensary Directory",
)
def list_pharmacies(
    division: Optional[str] = Query(None, description="Filter by division (e.g. Dhaka, Chittagong)"),
    district: Optional[str] = Query(None, description="Filter by district (e.g. Dhaka, Comilla)"),
    upazila: Optional[str] = Query(None, description="Filter by upazila (e.g. Dhanmondi, Mirpur)"),
    is_open_24_hours: Optional[bool] = Query(None, description="Filter for 24-hour open dispensaries"),
    search: Optional[str] = Query(None, description="Search term matching pharmacy name, address, or district"),
    limit: int = Query(20, ge=1, le=100, description="Page limit"),
    offset: int = Query(0, ge=0, description="Page offset"),
    db: Session = Depends(get_db),
):
    """
    Query licensed pharmacy and dispensary directory with 24-hour emergency filters and location matching.
    Only officially verified pharmacies are listed in public searches.
    """
    query = db.query(Pharmacy).filter(Pharmacy.verification_status == "verified")

    if division and division.strip() and division.strip().lower() != "all":
        query = query.filter(func.lower(Pharmacy.division) == division.strip().lower())

    if district and district.strip() and district.strip().lower() != "all":
        query = query.filter(func.lower(Pharmacy.district) == district.strip().lower())

    if upazila and upazila.strip():
        query = query.filter(func.lower(Pharmacy.upazila).ilike(f"%{upazila.strip().lower()}%"))

    if is_open_24_hours is not None:
        query = query.filter(Pharmacy.is_open_24_hours == is_open_24_hours)

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(Pharmacy.name).ilike(term),
                func.lower(Pharmacy.name_bn).ilike(term),
                func.lower(Pharmacy.address).ilike(term),
                func.lower(Pharmacy.district).ilike(term),
                func.lower(Pharmacy.upazila).ilike(term),
            )
        )

    query = query.order_by(Pharmacy.created_at.desc()).offset(offset).limit(limit)
    return query.all()


@router.get(
    "/{pharmacy_id}",
    response_model=PharmacyResponse,
    summary="Get Pharmacy Details by ID",
)
def get_pharmacy(
    pharmacy_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """
    Retrieve licensed pharmacy details by UUID.
    Unpublished unverified pharmacies are not exposed and return 404.
    """
    pharmacy = (
        db.query(Pharmacy)
        .filter(Pharmacy.id == pharmacy_id, Pharmacy.verification_status == "verified")
        .first()
    )
    if not pharmacy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pharmacy record not found.",
        )
    return pharmacy


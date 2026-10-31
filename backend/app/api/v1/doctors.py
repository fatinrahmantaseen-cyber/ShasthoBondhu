import logging
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.doctor import Doctor
from app.schemas.doctor import DoctorCreate, DoctorResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/doctors", tags=["Doctors & Specialists"])


@router.post(
    "",
    response_model=DoctorResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a Specialist Physician Profile",
)
def create_doctor(
    doctor_in: DoctorCreate,
    db: Session = Depends(get_db),
):
    """
    Register a specialist physician and chamber profile.
    New doctor profiles are assigned 'unverified' status until verified via BMDC credentials.
    """
    new_doctor = Doctor(
        name=doctor_in.name.strip(),
        name_bn=doctor_in.name_bn.strip() if doctor_in.name_bn else None,
        specialty=doctor_in.specialty.strip(),
        specialty_bn=doctor_in.specialty_bn.strip() if doctor_in.specialty_bn else None,
        qualifications=doctor_in.qualifications.strip(),
        hospital_or_chamber=doctor_in.hospital_or_chamber.strip(),
        chamber_address=doctor_in.chamber_address.strip(),
        division=doctor_in.division.strip(),
        district=doctor_in.district.strip(),
        upazila=doctor_in.upazila.strip(),
        visiting_hours=doctor_in.visiting_hours.strip() if doctor_in.visiting_hours else None,
        consultation_fee=doctor_in.consultation_fee.strip() if doctor_in.consultation_fee else None,
        public_contact=doctor_in.public_contact.strip(),
        bmdc_registration_number=doctor_in.bmdc_registration_number.strip() if doctor_in.bmdc_registration_number else None,
        verification_status="unverified",
        is_demo=False,
    )

    try:
        db.add(new_doctor)
        db.commit()
        db.refresh(new_doctor)
    except Exception as exc:
        db.rollback()
        logger.error("Database error creating doctor record: %s", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register doctor profile in database.",
        ) from None

    return new_doctor


@router.get(
    "",
    response_model=List[DoctorResponse],
    summary="Search Doctor & Specialist Directory",
)
def list_doctors(
    division: Optional[str] = Query(None, description="Filter by division (e.g. Dhaka, Chittagong)"),
    district: Optional[str] = Query(None, description="Filter by district (e.g. Dhaka, Comilla)"),
    upazila: Optional[str] = Query(None, description="Filter by upazila (e.g. Dhanmondi, Mirpur)"),
    specialty: Optional[str] = Query(None, description="Filter by medical specialty (e.g. Cardiology, Medicine)"),
    search: Optional[str] = Query(None, description="Search term matching doctor name, specialty, or chamber"),
    limit: int = Query(20, ge=1, le=100, description="Page limit"),
    offset: int = Query(0, ge=0, description="Page offset"),
    db: Session = Depends(get_db),
):
    """
    Search registered specialist physicians with specialty and location filtering.
    Only officially verified physicians are listed in public searches.
    """
    query = db.query(Doctor).filter(Doctor.verification_status == "verified")

    if division and division.strip() and division.strip().lower() != "all":
        query = query.filter(func.lower(Doctor.division) == division.strip().lower())

    if district and district.strip() and district.strip().lower() != "all":
        query = query.filter(func.lower(Doctor.district) == district.strip().lower())

    if upazila and upazila.strip():
        query = query.filter(func.lower(Doctor.upazila).ilike(f"%{upazila.strip().lower()}%"))

    if specialty and specialty.strip() and specialty.strip().lower() != "all":
        spec = specialty.strip().lower()
        query = query.filter(
            or_(
                func.lower(Doctor.specialty).ilike(f"%{spec}%"),
                func.lower(Doctor.specialty_bn).ilike(f"%{spec}%"),
            )
        )

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(Doctor.name).ilike(term),
                func.lower(Doctor.name_bn).ilike(term),
                func.lower(Doctor.specialty).ilike(term),
                func.lower(Doctor.specialty_bn).ilike(term),
                func.lower(Doctor.hospital_or_chamber).ilike(term),
                func.lower(Doctor.chamber_address).ilike(term),
                func.lower(Doctor.district).ilike(term),
                func.lower(Doctor.upazila).ilike(term),
            )
        )

    query = query.order_by(Doctor.created_at.desc()).offset(offset).limit(limit)
    return query.all()


@router.get(
    "/{doctor_id}",
    response_model=DoctorResponse,
    summary="Get Doctor Profile by ID",
)
def get_doctor(
    doctor_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """
    Retrieve specialist physician profile details by UUID.
    Unpublished unverified doctor profiles are not exposed and return 404.
    """
    doctor = (
        db.query(Doctor)
        .filter(Doctor.id == doctor_id, Doctor.verification_status == "verified")
        .first()
    )
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found.",
        )
    return doctor


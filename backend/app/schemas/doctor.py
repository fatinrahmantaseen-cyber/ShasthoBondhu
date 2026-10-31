import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

VALID_VERIFICATION_STATUSES = {"unverified", "pending_verification", "verified", "rejected"}


class DoctorBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    name_bn: Optional[str] = Field(None, max_length=200)
    specialty: str = Field(..., min_length=2, max_length=100)
    specialty_bn: Optional[str] = Field(None, max_length=150)
    qualifications: str = Field(..., min_length=2, max_length=255)
    hospital_or_chamber: str = Field(..., min_length=2, max_length=255)
    chamber_address: str = Field(..., min_length=5)
    division: str = Field(..., min_length=2, max_length=50)
    district: str = Field(..., min_length=2, max_length=50)
    upazila: str = Field(..., min_length=2, max_length=80)
    visiting_hours: Optional[str] = Field(None, max_length=150)
    consultation_fee: Optional[str] = Field(None, max_length=50)
    public_contact: str = Field(..., min_length=5, max_length=100)
    bmdc_registration_number: Optional[str] = Field(None, max_length=50)


class DoctorCreate(DoctorBase):
    pass


class DoctorUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    name_bn: Optional[str] = Field(None, max_length=200)
    specialty: Optional[str] = Field(None, min_length=2, max_length=100)
    specialty_bn: Optional[str] = Field(None, max_length=150)
    qualifications: Optional[str] = Field(None, max_length=255)
    hospital_or_chamber: Optional[str] = Field(None, max_length=255)
    chamber_address: Optional[str] = None
    division: Optional[str] = Field(None, max_length=50)
    district: Optional[str] = Field(None, max_length=50)
    upazila: Optional[str] = Field(None, max_length=80)
    visiting_hours: Optional[str] = None
    consultation_fee: Optional[str] = None
    public_contact: Optional[str] = None
    bmdc_registration_number: Optional[str] = None
    verification_status: Optional[str] = None

    @field_validator("verification_status")
    @classmethod
    def validate_verification(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_VERIFICATION_STATUSES:
            raise ValueError(f"Invalid verification status '{v}'. Must be one of: {', '.join(sorted(VALID_VERIFICATION_STATUSES))}")
        return v


class DoctorResponse(DoctorBase):
    id: uuid.UUID
    verification_status: str
    is_demo: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


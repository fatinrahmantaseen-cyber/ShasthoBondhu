import uuid
import re
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field, field_validator

VALID_BLOOD_GROUPS = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"}


class DonorBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    blood_group: str = Field(..., min_length=2, max_length=5)
    division: str = Field(..., min_length=2, max_length=50)
    district: str = Field(..., min_length=2, max_length=50)
    upazila: str = Field(..., min_length=2, max_length=80)
    area: Optional[str] = Field(None, max_length=150)

    @field_validator("blood_group")
    @classmethod
    def validate_blood_group(cls, v: str) -> str:
        clean = v.strip().upper()
        if clean not in VALID_BLOOD_GROUPS:
            raise ValueError(f"Invalid blood group '{v}'. Must be one of: {', '.join(sorted(VALID_BLOOD_GROUPS))}")
        return clean


class DonorCreate(DonorBase):
    phone: str = Field(..., min_length=10, max_length=20, description="Raw phone number to be masked and encrypted")
    email: Optional[str] = Field(None, max_length=255)
    consent_given: bool = Field(..., description="Explicit donor consent is mandatory")

    @field_validator("consent_given")
    @classmethod
    def must_give_consent(cls, v: bool) -> bool:
        if not v:
            raise ValueError("Explicit voluntary consent is required to register as a donor")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v)
        if len(digits) < 10 or len(digits) > 15:
            raise ValueError("Please provide a valid phone number with at least 10 digits")
        return v.strip()


class DonorUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    division: Optional[str] = Field(None, max_length=50)
    district: Optional[str] = Field(None, max_length=50)
    upazila: Optional[str] = Field(None, max_length=80)
    area: Optional[str] = Field(None, max_length=150)
    is_available: Optional[bool] = None
    last_donation_date: Optional[date] = None
    total_donations: Optional[int] = Field(None, ge=0)


class DonorPublic(DonorBase):
    """
    Publicly visible donor profile.
    Strictly omits phone_encrypted, email, consent_ip_hash, and private audit data.
    """
    id: uuid.UUID
    phone_masked: str
    is_available: bool
    last_donation_date: Optional[date] = None
    total_donations: int = 0
    is_demo: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

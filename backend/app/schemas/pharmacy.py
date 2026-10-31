import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field, field_validator

VALID_VERIFICATION_STATUSES = {"unverified", "pending_verification", "verified", "rejected"}


class PharmacyBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    name_bn: Optional[str] = Field(None, max_length=255)
    division: str = Field(..., min_length=2, max_length=50)
    district: str = Field(..., min_length=2, max_length=50)
    upazila: str = Field(..., min_length=2, max_length=80)
    address: str = Field(..., min_length=5)
    address_bn: Optional[str] = None
    public_contact: str = Field(..., min_length=5, max_length=100)
    is_open_24_hours: bool = False
    opening_hours: Optional[str] = Field(None, max_length=100)
    available_services: List[str] = Field(default_factory=list)
    drug_license_number: Optional[str] = Field(None, max_length=80)


class PharmacyCreate(PharmacyBase):
    pass


class PharmacyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    name_bn: Optional[str] = Field(None, max_length=255)
    division: Optional[str] = Field(None, max_length=50)
    district: Optional[str] = Field(None, max_length=50)
    upazila: Optional[str] = Field(None, max_length=80)
    address: Optional[str] = None
    address_bn: Optional[str] = None
    public_contact: Optional[str] = None
    is_open_24_hours: Optional[bool] = None
    opening_hours: Optional[str] = None
    available_services: Optional[List[str]] = None
    drug_license_number: Optional[str] = None
    verification_status: Optional[str] = None

    @field_validator("verification_status")
    @classmethod
    def validate_verification(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_VERIFICATION_STATUSES:
            raise ValueError(f"Invalid verification status '{v}'. Must be one of: {', '.join(sorted(VALID_VERIFICATION_STATUSES))}")
        return v


class PharmacyResponse(PharmacyBase):
    id: uuid.UUID
    verification_status: str
    is_demo: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


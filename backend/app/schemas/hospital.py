import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field, field_validator

VALID_CLASSIFICATIONS = {"Government", "Private", "Autonomous", "Specialized", "Other"}
VALID_VERIFICATION_STATUSES = {"unverified", "pending_verification", "verified", "rejected"}


class HospitalBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    name_bn: Optional[str] = Field(None, max_length=255)
    classification: str = Field(..., max_length=50)
    division: str = Field(..., min_length=2, max_length=50)
    district: str = Field(..., min_length=2, max_length=50)
    upazila: str = Field(..., min_length=2, max_length=80)
    address: str = Field(..., min_length=5)
    address_bn: Optional[str] = None
    public_contact: str = Field(..., min_length=5, max_length=100)
    emergency_hotline: Optional[str] = Field(None, max_length=50)
    available_services: List[str] = Field(default_factory=list)
    has_icu: bool = False
    has_emergency: bool = True
    has_dialysis: bool = False

    @field_validator("classification")
    @classmethod
    def validate_classification(cls, v: str) -> str:
        if v not in VALID_CLASSIFICATIONS:
            raise ValueError(f"Invalid classification '{v}'. Must be one of: {', '.join(sorted(VALID_CLASSIFICATIONS))}")
        return v


class HospitalCreate(HospitalBase):
    pass


class HospitalUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    name_bn: Optional[str] = Field(None, max_length=255)
    classification: Optional[str] = None
    division: Optional[str] = Field(None, max_length=50)
    district: Optional[str] = Field(None, max_length=50)
    upazila: Optional[str] = Field(None, max_length=80)
    address: Optional[str] = None
    address_bn: Optional[str] = None
    public_contact: Optional[str] = None
    emergency_hotline: Optional[str] = None
    available_services: Optional[List[str]] = None
    has_icu: Optional[bool] = None
    has_emergency: Optional[bool] = None
    has_dialysis: Optional[bool] = None
    verification_status: Optional[str] = None

    @field_validator("classification")
    @classmethod
    def validate_classification(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_CLASSIFICATIONS:
            raise ValueError(f"Invalid classification '{v}'. Must be one of: {', '.join(sorted(VALID_CLASSIFICATIONS))}")
        return v

    @field_validator("verification_status")
    @classmethod
    def validate_verification(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_VERIFICATION_STATUSES:
            raise ValueError(f"Invalid verification status '{v}'. Must be one of: {', '.join(sorted(VALID_VERIFICATION_STATUSES))}")
        return v


class HospitalResponse(HospitalBase):
    id: uuid.UUID
    verification_status: str
    is_demo: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


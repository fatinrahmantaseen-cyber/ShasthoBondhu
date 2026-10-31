import uuid
import re
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field, field_validator

VALID_BLOOD_GROUPS = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"}
VALID_REQUEST_STATUSES = {"pending", "in_progress", "fulfilled", "cancelled", "expired"}


class BloodRequestBase(BaseModel):
    blood_group: str = Field(..., min_length=2, max_length=5)
    division: str = Field(..., min_length=2, max_length=50)
    district: str = Field(..., min_length=2, max_length=50)
    upazila: str = Field(..., min_length=2, max_length=80)
    units_required: int = Field(1, ge=1, le=20)
    required_by: datetime
    hospital_name: str = Field(..., min_length=2, max_length=200)
    medical_reason: Optional[str] = Field(None, max_length=255)
    additional_notes: Optional[str] = None

    @field_validator("blood_group")
    @classmethod
    def validate_blood_group(cls, v: str) -> str:
        clean = v.strip().upper()
        if clean not in VALID_BLOOD_GROUPS:
            raise ValueError(f"Invalid blood group '{v}'. Must be one of: {', '.join(sorted(VALID_BLOOD_GROUPS))}")
        return clean

    @field_validator("units_required")
    @classmethod
    def validate_units(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("units_required must be a positive integer greater than zero")
        return v


class BloodRequestCreate(BloodRequestBase):
    contact_name: str = Field(..., min_length=2, max_length=100)
    contact_phone: str = Field(..., min_length=10, max_length=20, description="Requester raw phone number")

    @field_validator("contact_phone")
    @classmethod
    def validate_contact_phone(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v)
        if len(digits) < 10 or len(digits) > 15:
            raise ValueError("Please provide a valid contact phone number with at least 10 digits")
        return v.strip()

    @field_validator("required_by")
    @classmethod
    def validate_required_by(cls, v: datetime) -> datetime:
        now = datetime.now(timezone.utc)
        v_tz = v if v.tzinfo else v.replace(tzinfo=timezone.utc)
        if v_tz < now - timedelta(minutes=10):
            raise ValueError("required_by date/time cannot be in the past")
        return v


class BloodRequestUpdate(BaseModel):
    units_required: Optional[int] = Field(None, ge=1, le=20)
    required_by: Optional[datetime] = None
    hospital_name: Optional[str] = Field(None, min_length=2, max_length=200)
    medical_reason: Optional[str] = Field(None, max_length=255)
    additional_notes: Optional[str] = None
    request_status: Optional[str] = None

    @field_validator("request_status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_REQUEST_STATUSES:
            raise ValueError(f"Invalid request status '{v}'. Must be one of: {', '.join(sorted(VALID_REQUEST_STATUSES))}")
        return v


class BloodRequestPublic(BloodRequestBase):
    """
    Publicly visible blood request.
    Strictly excludes contact_phone_encrypted and raw phone numbers.
    """
    id: uuid.UUID
    request_status: str
    contact_name: str
    contact_phone_masked: str
    is_demo: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

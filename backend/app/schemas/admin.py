"""Schemas for administrator authentication, verification reviews, and audit trails."""

import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.hospital import HospitalResponse
from app.schemas.doctor import DoctorResponse
from app.schemas.pharmacy import PharmacyResponse


class AdminLoginRequest(BaseModel):
    """Admin login request schema."""

    username: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=1)


class AdminLoginResponse(BaseModel):
    """Admin login response schema with signed bearer token."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int


class VerificationReviewRequest(BaseModel):
    """Administrative action request to approve or reject a directory listing."""

    action: str = Field(..., description="Action to perform: 'approve' or 'reject'")
    notes: Optional[str] = Field(None, description="Review remarks. Required when rejecting.")

    @model_validator(mode="after")
    def validate_action_and_notes(self) -> "VerificationReviewRequest":
        action = self.action.strip().lower()
        if action not in ("approve", "reject"):
            raise ValueError("Action must be either 'approve' or 'reject'")
        self.action = action

        if action == "reject":
            if not self.notes or not self.notes.strip():
                raise ValueError("Notes (reason for rejection) are required when rejecting a submission")
            self.notes = self.notes.strip()
        elif self.notes:
            self.notes = self.notes.strip()
        return self


class VerificationAuditLogPublic(BaseModel):
    """Public representation of an immutable verification audit log entry."""

    id: uuid.UUID
    entity_type: str
    entity_id: uuid.UUID
    action: str
    previous_status: str
    new_status: str
    reviewer_username: str
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HospitalAdminResponse(HospitalResponse):
    """Hospital response including administrative review metadata."""

    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    review_notes: Optional[str] = None


class DoctorAdminResponse(DoctorResponse):
    """Doctor response including administrative review metadata."""

    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    review_notes: Optional[str] = None


class PharmacyAdminResponse(PharmacyResponse):
    """Pharmacy response including administrative review metadata."""

    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    review_notes: Optional[str] = None


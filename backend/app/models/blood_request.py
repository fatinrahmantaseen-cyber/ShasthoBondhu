import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Boolean, DateTime, Text, CheckConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base


class BloodRequest(Base):
    """Emergency Blood Request model with privacy-first contact protection."""

    __tablename__ = "blood_requests"
    __table_args__ = (
        CheckConstraint(
            "blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')",
            name="ck_blood_requests_blood_group",
        ),
        CheckConstraint(
            "units_required > 0",
            name="ck_blood_requests_units_positive",
        ),
        CheckConstraint(
            "request_status IN ('pending', 'in_progress', 'fulfilled', 'cancelled', 'expired')",
            name="ck_blood_requests_status",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
        index=True,
    )
    blood_group: Mapped[str] = mapped_column(String(5), nullable=False, index=True)
    division: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    district: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    upazila: Mapped[str] = mapped_column(String(80), nullable=False, index=True)

    units_required: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    required_by: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    hospital_name: Mapped[str] = mapped_column(String(200), nullable=False)
    medical_reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    additional_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Request Lifecycle Status: pending, in_progress, fulfilled, cancelled, expired
    request_status: Mapped[str] = mapped_column(String(30), default="pending", nullable=False, index=True)

    # Privacy protections: Requester private contact details are masked publicly
    contact_name: Mapped[str] = mapped_column(String(100), nullable=False)
    contact_phone_masked: Mapped[str] = mapped_column(String(30), nullable=False)
    contact_phone_encrypted: Mapped[str] = mapped_column(String(255), nullable=False)

    # Metadata
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

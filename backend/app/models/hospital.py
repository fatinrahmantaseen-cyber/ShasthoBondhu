import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Boolean, DateTime, Text, CheckConstraint, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base


class Hospital(Base):
    """Hospital and Healthcare Facility model."""

    __tablename__ = "hospitals"
    __table_args__ = (
        CheckConstraint(
            "verification_status IN ('unverified', 'pending_verification', 'verified', 'rejected')",
            name="ck_hospitals_verification_status",
        ),
        CheckConstraint(
            "classification IN ('Government', 'Private', 'Autonomous', 'Specialized', 'Other')",
            name="ck_hospitals_classification",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
        index=True,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    name_bn: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    classification: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    division: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    district: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    upazila: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    address_bn: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    public_contact: Mapped[str] = mapped_column(String(100), nullable=False)
    emergency_hotline: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Facilities & Capabilities
    available_services: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    has_icu: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    has_emergency: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    has_dialysis: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)

    # Verification workflow: unverified, pending_verification, verified, rejected
    verification_status: Mapped[str] = mapped_column(String(30), default="unverified", nullable=False, index=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Administrative review metadata
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewed_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    review_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

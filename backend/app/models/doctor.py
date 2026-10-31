import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, DateTime, Text, CheckConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base


class Doctor(Base):
    """Specialist Physician & Chamber model."""

    __tablename__ = "doctors"
    __table_args__ = (
        CheckConstraint(
            "verification_status IN ('unverified', 'pending_verification', 'verified', 'rejected')",
            name="ck_doctors_verification_status",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
        index=True,
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    name_bn: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    specialty: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    specialty_bn: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    qualifications: Mapped[str] = mapped_column(String(255), nullable=False)

    hospital_or_chamber: Mapped[str] = mapped_column(String(255), nullable=False)
    chamber_address: Mapped[str] = mapped_column(Text, nullable=False)
    division: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    district: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    upazila: Mapped[str] = mapped_column(String(80), nullable=False, index=True)

    visiting_hours: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    consultation_fee: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    public_contact: Mapped[str] = mapped_column(String(100), nullable=False)

    # Regulatory verification: BMDC (Bangladesh Medical and Dental Council) registration
    bmdc_registration_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
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

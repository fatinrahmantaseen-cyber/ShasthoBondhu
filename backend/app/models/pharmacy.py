import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Boolean, DateTime, Text, CheckConstraint, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base


class Pharmacy(Base):
    """Licensed Pharmacy & Dispensary model."""

    __tablename__ = "pharmacies"
    __table_args__ = (
        CheckConstraint(
            "verification_status IN ('unverified', 'pending_verification', 'verified', 'rejected')",
            name="ck_pharmacies_verification_status",
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

    division: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    district: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    upazila: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    address_bn: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    public_contact: Mapped[str] = mapped_column(String(100), nullable=False)
    is_open_24_hours: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    opening_hours: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    available_services: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)

    # DGDA (Directorate General of Drug Administration) License
    drug_license_number: Mapped[Optional[str]] = mapped_column(String(80), nullable=True, index=True)
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

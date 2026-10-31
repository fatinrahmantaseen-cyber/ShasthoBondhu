import uuid
from datetime import date, datetime
from typing import Optional
from sqlalchemy import String, Boolean, Integer, Date, DateTime, CheckConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base


class Donor(Base):
    """Voluntary Blood Donor model with strict privacy and consent tracking."""

    __tablename__ = "donors"
    __table_args__ = (
        CheckConstraint(
            "blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')",
            name="ck_donors_blood_group",
        ),
        CheckConstraint(
            "total_donations >= 0",
            name="ck_donors_total_donations_non_negative",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
        index=True,
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    blood_group: Mapped[str] = mapped_column(String(5), nullable=False, index=True)
    division: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    district: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    upazila: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    area: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)

    # Privacy protections: Public queries only see masked phone; raw phone is secured
    phone_masked: Mapped[str] = mapped_column(String(30), nullable=False)
    phone_encrypted: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Availability & Activity
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    last_donation_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    total_donations: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Explicit Consent Protocol (safe blood donation in Bangladesh must be voluntary & non-commercial)
    consent_given: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    consent_timestamp: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    consent_ip_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    # Metadata & Auditing
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

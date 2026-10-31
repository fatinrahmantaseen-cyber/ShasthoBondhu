import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Text, CheckConstraint, func, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base


class VerificationAuditLog(Base):
    """Immutable audit log for administrative verification decisions."""

    __tablename__ = "verification_audit_logs"
    __table_args__ = (
        CheckConstraint(
            "entity_type IN ('hospital', 'doctor', 'pharmacy')",
            name="ck_verification_audit_logs_entity_type",
        ),
        CheckConstraint(
            "action IN ('approve', 'reject')",
            name="ck_verification_audit_logs_action",
        ),
        Index("ix_verification_audit_logs_entity", "entity_type", "entity_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
        index=True,
    )
    entity_type: Mapped[str] = mapped_column(String(30), nullable=False)
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    action: Mapped[str] = mapped_column(String(30), nullable=False)
    previous_status: Mapped[str] = mapped_column(String(30), nullable=False)
    new_status: Mapped[str] = mapped_column(String(30), nullable=False)
    reviewer_username: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )


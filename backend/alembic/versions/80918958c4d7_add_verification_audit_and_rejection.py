"""add_verification_audit_and_rejection

Revision ID: 80918958c4d7
Revises: 91d28eb368f9
Create Date: 2026-10-22 14:06:44.596877

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '80918958c4d7'
down_revision: Union[str, Sequence[str], None] = '91d28eb368f9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: allow 'rejected' verification status, add review metadata and audit log table."""
    # 1. Update check constraints and add review metadata to 'hospitals'
    op.drop_constraint('ck_hospitals_verification_status', 'hospitals', type_='check')
    op.create_check_constraint(
        'ck_hospitals_verification_status',
        'hospitals',
        "verification_status IN ('unverified', 'pending_verification', 'verified', 'rejected')",
    )
    op.add_column('hospitals', sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('hospitals', sa.Column('reviewed_by', sa.String(length=100), nullable=True))
    op.add_column('hospitals', sa.Column('review_notes', sa.Text(), nullable=True))

    # 2. Update check constraints and add review metadata to 'doctors'
    op.drop_constraint('ck_doctors_verification_status', 'doctors', type_='check')
    op.create_check_constraint(
        'ck_doctors_verification_status',
        'doctors',
        "verification_status IN ('unverified', 'pending_verification', 'verified', 'rejected')",
    )
    op.add_column('doctors', sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('doctors', sa.Column('reviewed_by', sa.String(length=100), nullable=True))
    op.add_column('doctors', sa.Column('review_notes', sa.Text(), nullable=True))

    # 3. Update check constraints and add review metadata to 'pharmacies'
    op.drop_constraint('ck_pharmacies_verification_status', 'pharmacies', type_='check')
    op.create_check_constraint(
        'ck_pharmacies_verification_status',
        'pharmacies',
        "verification_status IN ('unverified', 'pending_verification', 'verified', 'rejected')",
    )
    op.add_column('pharmacies', sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('pharmacies', sa.Column('reviewed_by', sa.String(length=100), nullable=True))
    op.add_column('pharmacies', sa.Column('review_notes', sa.Text(), nullable=True))

    # 4. Create 'verification_audit_logs' table for immutable review audit trails
    op.create_table(
        'verification_audit_logs',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('entity_type', sa.String(length=30), nullable=False),
        sa.Column('entity_id', sa.UUID(), nullable=False),
        sa.Column('action', sa.String(length=30), nullable=False),
        sa.Column('previous_status', sa.String(length=30), nullable=False),
        sa.Column('new_status', sa.String(length=30), nullable=False),
        sa.Column('reviewer_username', sa.String(length=100), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint("entity_type IN ('hospital', 'doctor', 'pharmacy')", name='ck_verification_audit_logs_entity_type'),
        sa.CheckConstraint("action IN ('approve', 'reject')", name='ck_verification_audit_logs_action'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_verification_audit_logs_id'), 'verification_audit_logs', ['id'], unique=False)
    op.create_index(op.f('ix_verification_audit_logs_created_at'), 'verification_audit_logs', ['created_at'], unique=False)
    op.create_index(op.f('ix_verification_audit_logs_reviewer'), 'verification_audit_logs', ['reviewer_username'], unique=False)
    op.create_index('ix_verification_audit_logs_entity', 'verification_audit_logs', ['entity_type', 'entity_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema: remove audit logs and revert review metadata and constraints."""
    op.drop_index('ix_verification_audit_logs_entity', table_name='verification_audit_logs')
    op.drop_index(op.f('ix_verification_audit_logs_reviewer'), table_name='verification_audit_logs')
    op.drop_index(op.f('ix_verification_audit_logs_created_at'), table_name='verification_audit_logs')
    op.drop_index(op.f('ix_verification_audit_logs_id'), table_name='verification_audit_logs')
    op.drop_table('verification_audit_logs')

    # Revert pharmacies
    op.drop_column('pharmacies', 'review_notes')
    op.drop_column('pharmacies', 'reviewed_by')
    op.drop_column('pharmacies', 'reviewed_at')
    op.drop_constraint('ck_pharmacies_verification_status', 'pharmacies', type_='check')
    op.create_check_constraint(
        'ck_pharmacies_verification_status',
        'pharmacies',
        "verification_status IN ('unverified', 'pending_verification', 'verified')",
    )

    # Revert doctors
    op.drop_column('doctors', 'review_notes')
    op.drop_column('doctors', 'reviewed_by')
    op.drop_column('doctors', 'reviewed_at')
    op.drop_constraint('ck_doctors_verification_status', 'doctors', type_='check')
    op.create_check_constraint(
        'ck_doctors_verification_status',
        'doctors',
        "verification_status IN ('unverified', 'pending_verification', 'verified')",
    )

    # Revert hospitals
    op.drop_column('hospitals', 'review_notes')
    op.drop_column('hospitals', 'reviewed_by')
    op.drop_column('hospitals', 'reviewed_at')
    op.drop_constraint('ck_hospitals_verification_status', 'hospitals', type_='check')
    op.create_check_constraint(
        'ck_hospitals_verification_status',
        'hospitals',
        "verification_status IN ('unverified', 'pending_verification', 'verified')",
    )

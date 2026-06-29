"""Add handover report fields to leave_applications

Revision ID: 20260506_0012
Revises: 20260428_0011
Create Date: 2026-05-06 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "20260506_0012"
down_revision = "20260428_0011"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_cols = [col["name"] for col in inspector.get_columns("leave_applications")]

    if "handover_report" not in existing_cols:
        op.add_column(
            "leave_applications",
            sa.Column("handover_report", sa.Text(), nullable=True),
        )

    if "handover_submitted_on" not in existing_cols:
        op.add_column(
            "leave_applications",
            sa.Column("handover_submitted_on", sa.String(), nullable=True),
        )


def downgrade():
    op.drop_column("leave_applications", "handover_submitted_on")
    op.drop_column("leave_applications", "handover_report")
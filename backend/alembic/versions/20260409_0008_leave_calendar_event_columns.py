"""Add leave-aware columns to calendar_events

Revision ID: 20260409_0008
Revises: 20260408_0007
Create Date: 2026-04-09 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "20260409_0008"
down_revision = "20260408_0007"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_cols = [col["name"] for col in inspector.get_columns("calendar_events")]

    if "end_date" not in existing_cols:
        op.add_column("calendar_events", sa.Column("end_date", sa.String(), nullable=True))
    if "employee_name" not in existing_cols:
        op.add_column("calendar_events", sa.Column("employee_name", sa.String(), nullable=True))
    if "department" not in existing_cols:
        op.add_column("calendar_events", sa.Column("department", sa.String(), nullable=True))
    if "event_type" not in existing_cols:
        op.add_column(
            "calendar_events",
            sa.Column("event_type", sa.String(), nullable=True, server_default="event"),
        )
    if "leave_application_id" not in existing_cols:
        op.add_column(
            "calendar_events",
            sa.Column("leave_application_id", sa.Integer(), nullable=True),
        )


def downgrade():
    op.drop_column("calendar_events", "leave_application_id")
    op.drop_column("calendar_events", "event_type")
    op.drop_column("calendar_events", "department")
    op.drop_column("calendar_events", "employee_name")
    op.drop_column("calendar_events", "end_date")

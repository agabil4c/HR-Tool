"""add clock and total hour fields to attendance_records

Revision ID: 20260428_0011
Revises: 20260428_0010
Create Date: 2026-04-28 00:30:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "20260428_0011"
down_revision = "20260428_0010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_cols = {col["name"] for col in inspector.get_columns("attendance_records")}

    if "clock_in" not in existing_cols:
        op.add_column("attendance_records", sa.Column("clock_in", sa.String(), nullable=True))
    if "clock_out" not in existing_cols:
        op.add_column("attendance_records", sa.Column("clock_out", sa.String(), nullable=True))
    if "total_hours" not in existing_cols:
        op.add_column("attendance_records", sa.Column("total_hours", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("attendance_records", "total_hours")
    op.drop_column("attendance_records", "clock_out")
    op.drop_column("attendance_records", "clock_in")

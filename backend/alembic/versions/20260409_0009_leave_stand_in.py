"""Add stand_in column to leave_applications

Revision ID: 20260409_0009
Revises: 20260409_0008
Create Date: 2026-04-09 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "20260409_0009"
down_revision = "20260409_0008"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_cols = [col["name"] for col in inspector.get_columns("leave_applications")]

    if "stand_in" not in existing_cols:
        op.add_column(
            "leave_applications",
            sa.Column("stand_in", sa.String(), nullable=True),
        )


def downgrade():
    op.drop_column("leave_applications", "stand_in")

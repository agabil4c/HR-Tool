"""add target_audience to review_cycles

Revision ID: 20260408_0007
Revises: 20260407_0006
Create Date: 2026-04-08 00:00:00
"""

from alembic import op
import sqlalchemy as sa

revision = "20260408_0007"
down_revision = "20260407_0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [col["name"] for col in inspector.get_columns("review_cycles")]
    if "target_audience" not in columns:
        op.add_column(
            "review_cycles",
            sa.Column(
                "target_audience",
                sa.String(),
                nullable=True,
                server_default="all_staff",
            ),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [col["name"] for col in inspector.get_columns("review_cycles")]
    if "target_audience" in columns:
        op.drop_column("review_cycles", "target_audience")

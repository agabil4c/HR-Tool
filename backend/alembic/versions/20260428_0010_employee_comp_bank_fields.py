"""add salary and split bank fields to employees

Revision ID: 20260428_0010
Revises: 20260409_0007
Create Date: 2026-04-28 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "20260428_0010"
down_revision = "20260409_0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_cols = {col["name"] for col in inspector.get_columns("employees")}

    if "salary_benefits" not in existing_cols:
        op.add_column("employees", sa.Column("salary_benefits", sa.String(), nullable=True))
    if "bank_account" not in existing_cols:
        op.add_column("employees", sa.Column("bank_account", sa.String(), nullable=True))
    if "account_names" not in existing_cols:
        op.add_column("employees", sa.Column("account_names", sa.String(), nullable=True))
    if "bank_name" not in existing_cols:
        op.add_column("employees", sa.Column("bank_name", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("employees", "bank_name")
    op.drop_column("employees", "account_names")
    op.drop_column("employees", "bank_account")
    op.drop_column("employees", "salary_benefits")

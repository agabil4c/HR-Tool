"""add employee-user link for onboarding

Revision ID: 20260324_0004
Revises: 20260324_0003
Create Date: 2026-03-24 12:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260324_0004"
down_revision = "20260324_0003"
branch_labels = None
depends_on = None


def _get_columns(inspector: sa.Inspector, table_name: str) -> set[str]:
    return {col["name"] for col in inspector.get_columns(table_name)}


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("employees"):
        return

    employee_columns = _get_columns(inspector, "employees")
    if "user_id" not in employee_columns:
        with op.batch_alter_table("employees") as batch:
            batch.add_column(sa.Column("user_id", sa.Integer(), nullable=True))

    index_names = {idx["name"] for idx in inspector.get_indexes("employees")}
    if "ix_employees_user_id" not in index_names:
        op.create_index("ix_employees_user_id", "employees", ["user_id"], unique=True)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("employees"):
        return

    index_names = {idx["name"] for idx in inspector.get_indexes("employees")}
    if "ix_employees_user_id" in index_names:
        op.drop_index("ix_employees_user_id", table_name="employees")

    employee_columns = _get_columns(inspector, "employees")
    if "user_id" in employee_columns:
        with op.batch_alter_table("employees") as batch:
            batch.drop_column("user_id")

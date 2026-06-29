"""backfill user auth schema for existing databases

Revision ID: 20260319_0002
Revises: 20260319_0001
Create Date: 2026-03-19 12:30:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260319_0002"
down_revision = "20260319_0001"
branch_labels = None
depends_on = None


def _get_columns(inspector: sa.Inspector, table_name: str) -> set[str]:
    return {col["name"] for col in inspector.get_columns(table_name)}


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if inspector.has_table("users"):
        user_columns = _get_columns(inspector, "users")

        if "department" not in user_columns:
            op.add_column("users", sa.Column("department", sa.String(), nullable=True))
        if "access_level" not in user_columns:
            op.add_column("users", sa.Column("access_level", sa.String(), nullable=True))
        if "dashboard_route" not in user_columns:
            op.add_column("users", sa.Column("dashboard_route", sa.String(), nullable=True))
        if "allowed_sections" not in user_columns:
            op.add_column("users", sa.Column("allowed_sections", sa.JSON(), nullable=True))

        bind.execute(sa.text("UPDATE users SET department = COALESCE(department, 'General')"))
        bind.execute(sa.text("UPDATE users SET access_level = COALESCE(access_level, 'self-service')"))
        bind.execute(sa.text("UPDATE users SET dashboard_route = COALESCE(dashboard_route, '/my-profile')"))
        bind.execute(sa.text("UPDATE users SET allowed_sections = COALESCE(allowed_sections, '[]')"))

        # Preserve bootstrap behavior for the default super admin account if present.
        bind.execute(
            sa.text(
                """
                UPDATE users
                SET department = 'HR',
                    role = 'super-admin',
                    access_level = 'full-access',
                    dashboard_route = '/index',
                    allowed_sections = '["*"]'
                WHERE lower(email) = 'superadmin@hrtool.local'
                """
            )
        )

    if not inspector.has_table("role_access_profiles"):
        op.create_table(
            "role_access_profiles",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("description", sa.String(), nullable=True),
            sa.Column("access_level", sa.String(), nullable=False),
            sa.Column("dashboard_route", sa.String(), nullable=False),
            sa.Column("permissions", sa.JSON(), nullable=True),
            sa.Column("is_system", sa.Boolean(), nullable=True),
        )
        op.create_index(op.f("ix_role_access_profiles_id"), "role_access_profiles", ["id"], unique=False)
        op.create_index(op.f("ix_role_access_profiles_name"), "role_access_profiles", ["name"], unique=True)


def downgrade() -> None:
    # Intentionally conservative for SQLite compatibility.
    # This downgrade removes only the role_access_profiles table if present.
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if inspector.has_table("role_access_profiles"):
        index_names = {idx["name"] for idx in inspector.get_indexes("role_access_profiles")}
        if op.f("ix_role_access_profiles_name") in index_names:
            op.drop_index(op.f("ix_role_access_profiles_name"), table_name="role_access_profiles")
        if op.f("ix_role_access_profiles_id") in index_names:
            op.drop_index(op.f("ix_role_access_profiles_id"), table_name="role_access_profiles")
        op.drop_table("role_access_profiles")

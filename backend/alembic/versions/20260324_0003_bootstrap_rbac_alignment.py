"""align bootstrap state with strict RBAC requirements

Revision ID: 20260324_0003
Revises: 20260319_0002
Create Date: 2026-03-24 09:00:00
"""

from datetime import date

from alembic import op
import sqlalchemy as sa


revision = "20260324_0003"
down_revision = "20260319_0002"
branch_labels = None
depends_on = None


def _get_columns(inspector: sa.Inspector, table_name: str) -> set[str]:
    return {col["name"] for col in inspector.get_columns(table_name)}


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if inspector.has_table("leave_applications"):
        leave_columns = _get_columns(inspector, "leave_applications")
        if "department" not in leave_columns:
            op.add_column("leave_applications", sa.Column("department", sa.String(), nullable=True))
        if "submitted_by_user_id" not in leave_columns:
            op.add_column("leave_applications", sa.Column("submitted_by_user_id", sa.Integer(), nullable=True))

    if inspector.has_table("users"):
        bind.execute(sa.text("UPDATE users SET role = 'staff' WHERE lower(role) = 'employee'"))

    # Ensure current-year calendar events exist for first deployment.
    current_year = date.today().year
    if inspector.has_table("calendar_events"):
        existing_count = bind.execute(sa.text("SELECT COUNT(1) FROM calendar_events")).scalar() or 0
        if existing_count == 0:
            for month in range(1, 13):
                month_name = date(current_year, month, 1).strftime("%B")
                bind.execute(
                    sa.text(
                        """
                        INSERT INTO calendar_events (title, start_date, class_names)
                        VALUES (:title, :start_date, :class_names)
                        """
                    ),
                    {
                        "title": f"{current_year} {month_name} Calendar",
                        "start_date": f"{current_year}-{month:02d}-01",
                        "class_names": '["!text-primary"]',
                    },
                )

    # If this is still an untouched bootstrap database, remove preloaded role profile and department.
    if inspector.has_table("users") and inspector.has_table("departments") and inspector.has_table("role_access_profiles"):
        user_count = bind.execute(sa.text("SELECT COUNT(1) FROM users")).scalar() or 0
        employee_count = bind.execute(sa.text("SELECT COUNT(1) FROM employees")).scalar() if inspector.has_table("employees") else 0
        role_profile_count = bind.execute(sa.text("SELECT COUNT(1) FROM role_access_profiles")).scalar() or 0
        default_super_admin = bind.execute(
            sa.text("SELECT COUNT(1) FROM users WHERE lower(email) = 'superadmin@hrtool.local'")
        ).scalar() or 0

        if user_count == 1 and default_super_admin == 1 and employee_count == 0 and role_profile_count <= 1:
            bind.execute(sa.text("DELETE FROM role_access_profiles WHERE lower(name) = 'super-admin'"))
            bind.execute(sa.text("DELETE FROM departments WHERE lower(name) = 'hr'"))


def downgrade() -> None:
    # Conservative downgrade for SQLite: remove only the new leave columns if they exist.
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if inspector.has_table("leave_applications"):
        columns = _get_columns(inspector, "leave_applications")
        with op.batch_alter_table("leave_applications") as batch:
            if "submitted_by_user_id" in columns:
                batch.drop_column("submitted_by_user_id")
            if "department" in columns:
                batch.drop_column("department")

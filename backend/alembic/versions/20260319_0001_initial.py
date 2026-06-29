"""initial schema

Revision ID: 20260319_0001
Revises:
Create Date: 2026-03-19 00:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260319_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=False),
        sa.Column("department", sa.String(), nullable=True),
        sa.Column("role", sa.String(), nullable=True),
        sa.Column("access_level", sa.String(), nullable=True),
        sa.Column("dashboard_route", sa.String(), nullable=True),
        sa.Column("allowed_sections", sa.JSON(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.create_table(
        "departments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("head", sa.String(), nullable=True),
        sa.Column("staff_count", sa.Integer(), nullable=True),
        sa.Column("approval_level", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("icon", sa.String(), nullable=True),
        sa.Column("icon_bg", sa.String(), nullable=True),
        sa.Column("avatar_color", sa.String(), nullable=True),
    )
    op.create_index(op.f("ix_departments_id"), "departments", ["id"], unique=False)
    op.create_index(op.f("ix_departments_name"), "departments", ["name"], unique=True)

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

    users_table = sa.table(
        "users",
        sa.column("email", sa.String()),
        sa.column("password_hash", sa.String()),
        sa.column("full_name", sa.String()),
        sa.column("department", sa.String()),
        sa.column("role", sa.String()),
        sa.column("access_level", sa.String()),
        sa.column("dashboard_route", sa.String()),
        sa.column("allowed_sections", sa.JSON()),
        sa.column("is_active", sa.Boolean()),
    )
    op.bulk_insert(
        users_table,
        [
            {
                "email": "superadmin@hrtool.local",
                "password_hash": "SuperAdmin@123",
                "full_name": "System Super Admin",
                "department": "HR",
                "role": "super-admin",
                "access_level": "full-access",
                "dashboard_route": "/index",
                "allowed_sections": ["*"],
                "is_active": True,
            }
        ],
    )

    op.create_table(
        "employees",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("initials", sa.String(length=5), nullable=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("started_at", sa.String(), nullable=True),
        sa.Column("role", sa.String(), nullable=True),
        sa.Column("department_id", sa.Integer(), sa.ForeignKey("departments.id"), nullable=True),
        sa.Column("contact", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("avatar", sa.String(), nullable=True),
        sa.Column("reporting", sa.JSON(), nullable=True),
    )
    op.create_index(op.f("ix_employees_id"), "employees", ["id"], unique=False)

    op.create_table(
        "holidays",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("day", sa.String(), nullable=True),
        sa.Column("date", sa.String(), nullable=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("type", sa.String(), nullable=True),
    )
    op.create_index(op.f("ix_holidays_id"), "holidays", ["id"], unique=False)

    op.create_table(
        "attendance_records",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("employee_id", sa.Integer(), sa.ForeignKey("employees.id"), nullable=True),
        sa.Column("date", sa.String(), nullable=True),
        sa.Column("day", sa.String(), nullable=True),
        sa.Column("check_in", sa.String(), nullable=True),
        sa.Column("check_out", sa.String(), nullable=True),
        sa.Column("meal_break", sa.String(), nullable=True),
        sa.Column("work_hours", sa.String(), nullable=True),
        sa.Column("work_hours_val", sa.Float(), nullable=True),
        sa.Column("overtime", sa.String(), nullable=True),
        sa.Column("approval_status", sa.String(), nullable=True),
    )
    op.create_index(op.f("ix_attendance_records_id"), "attendance_records", ["id"], unique=False)

    op.create_table(
        "monthly_attendance",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("employee_id", sa.Integer(), sa.ForeignKey("employees.id"), nullable=True),
        sa.Column("employee_name", sa.String(), nullable=True),
        sa.Column("month_year", sa.String(), nullable=True),
        sa.Column("days", sa.JSON(), nullable=True),
    )
    op.create_index(op.f("ix_monthly_attendance_id"), "monthly_attendance", ["id"], unique=False)

    op.create_table(
        "roster_entries",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("employee_id", sa.Integer(), sa.ForeignKey("employees.id"), nullable=True),
        sa.Column("employee_name", sa.String(), nullable=True),
        sa.Column("initials", sa.String(length=5), nullable=True),
        sa.Column("week_label", sa.String(), nullable=True),
        sa.Column("statuses", sa.JSON(), nullable=True),
    )
    op.create_index(op.f("ix_roster_entries_id"), "roster_entries", ["id"], unique=False)

    op.create_table(
        "performance_reviews",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("employee", sa.String(), nullable=False),
        sa.Column("reviewer", sa.String(), nullable=True),
        sa.Column("period", sa.String(), nullable=True),
        sa.Column("score", sa.String(), nullable=True),
        sa.Column("outcome", sa.String(), nullable=True),
    )
    op.create_index(op.f("ix_performance_reviews_id"), "performance_reviews", ["id"], unique=False)

    op.create_table(
        "review_templates",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("audience", sa.String(), nullable=True),
        sa.Column("age", sa.String(), nullable=True),
        sa.Column("tag", sa.String(), nullable=True),
        sa.Column("icon", sa.String(), nullable=True),
        sa.Column("tone", sa.String(), nullable=True),
    )
    op.create_index(op.f("ix_review_templates_id"), "review_templates", ["id"], unique=False)

    op.create_table(
        "leave_applications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("employee_name", sa.String(), nullable=True),
        sa.Column("leave_type", sa.String(), nullable=False),
        sa.Column("reason", sa.String(), nullable=True),
        sa.Column("days", sa.Integer(), nullable=True),
        sa.Column("from_date", sa.String(), nullable=True),
        sa.Column("to_date", sa.String(), nullable=True),
        sa.Column("reviewer", sa.String(), nullable=True),
        sa.Column("submitted_on", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
    )
    op.create_index(op.f("ix_leave_applications_id"), "leave_applications", ["id"], unique=False)

    op.create_table(
        "marked_dates",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("dates", sa.JSON(), nullable=True),
        sa.Column("marked_on", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
    )
    op.create_index(op.f("ix_marked_dates_id"), "marked_dates", ["id"], unique=False)

    op.create_table(
        "approval_requests",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("employee", sa.String(), nullable=False),
        sa.Column("period", sa.String(), nullable=True),
        sa.Column("approver", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
    )
    op.create_index(op.f("ix_approval_requests_id"), "approval_requests", ["id"], unique=False)

    op.create_table(
        "calendar_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("start_date", sa.String(), nullable=True),
        sa.Column("class_names", sa.JSON(), nullable=True),
    )
    op.create_index(op.f("ix_calendar_events_id"), "calendar_events", ["id"], unique=False)

    op.create_table(
        "external_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("class_name", sa.String(), nullable=True),
    )
    op.create_index(op.f("ix_external_events_id"), "external_events", ["id"], unique=False)

    op.create_table(
        "performance_metrics",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("employee_id", sa.Integer(), sa.ForeignKey("employees.id"), nullable=True),
        sa.Column("label", sa.String(), nullable=True),
        sa.Column("score", sa.String(), nullable=True),
        sa.Column("percentage", sa.Integer(), nullable=True),
    )
    op.create_index(op.f("ix_performance_metrics_id"), "performance_metrics", ["id"], unique=False)

    op.create_table(
        "documents",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("employee_id", sa.Integer(), sa.ForeignKey("employees.id"), nullable=True),
        sa.Column("name", sa.String(), nullable=True),
        sa.Column("size", sa.String(), nullable=True),
        sa.Column("icon", sa.String(), nullable=True),
    )
    op.create_index(op.f("ix_documents_id"), "documents", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_documents_id"), table_name="documents")
    op.drop_table("documents")
    op.drop_index(op.f("ix_performance_metrics_id"), table_name="performance_metrics")
    op.drop_table("performance_metrics")
    op.drop_index(op.f("ix_external_events_id"), table_name="external_events")
    op.drop_table("external_events")
    op.drop_index(op.f("ix_calendar_events_id"), table_name="calendar_events")
    op.drop_table("calendar_events")
    op.drop_index(op.f("ix_approval_requests_id"), table_name="approval_requests")
    op.drop_table("approval_requests")
    op.drop_index(op.f("ix_marked_dates_id"), table_name="marked_dates")
    op.drop_table("marked_dates")
    op.drop_index(op.f("ix_leave_applications_id"), table_name="leave_applications")
    op.drop_table("leave_applications")
    op.drop_index(op.f("ix_review_templates_id"), table_name="review_templates")
    op.drop_table("review_templates")
    op.drop_index(op.f("ix_performance_reviews_id"), table_name="performance_reviews")
    op.drop_table("performance_reviews")
    op.drop_index(op.f("ix_roster_entries_id"), table_name="roster_entries")
    op.drop_table("roster_entries")
    op.drop_index(op.f("ix_monthly_attendance_id"), table_name="monthly_attendance")
    op.drop_table("monthly_attendance")
    op.drop_index(op.f("ix_attendance_records_id"), table_name="attendance_records")
    op.drop_table("attendance_records")
    op.drop_index(op.f("ix_holidays_id"), table_name="holidays")
    op.drop_table("holidays")
    op.drop_index(op.f("ix_role_access_profiles_name"), table_name="role_access_profiles")
    op.drop_index(op.f("ix_role_access_profiles_id"), table_name="role_access_profiles")
    op.drop_table("role_access_profiles")
    op.drop_index(op.f("ix_employees_id"), table_name="employees")
    op.drop_table("employees")
    op.drop_index(op.f("ix_departments_name"), table_name="departments")
    op.drop_index(op.f("ix_departments_id"), table_name="departments")
    op.drop_table("departments")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_table("users")

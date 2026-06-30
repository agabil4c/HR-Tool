from datetime import date

from app import models
from app.database import SessionLocal


INITIAL_SUPER_ADMIN = {
    "email": "superadmin@hrtool.local",
    "password_hash": "SuperAdmin@123",
    "full_name": "System Super Admin",
    "department": "HR",
    "role": "super-admin",
    "access_level": "super-admin",
    "dashboard_route": "/index",
    "allowed_sections": ["*"],
    "is_active": True,
}

def _build_current_year_calendar_events() -> list[dict]:
    current_year = date.today().year
    return [
        {
            "title": f"{current_year} {month_name} Calendar",
            "start_date": f"{current_year}-{month:02d}-01",
            "class_names": ["!text-primary"],
        }
        for month, month_name in [
            (1, "January"),
            (2, "February"),
            (3, "March"),
            (4, "April"),
            (5, "May"),
            (6, "June"),
            (7, "July"),
            (8, "August"),
            (9, "September"),
            (10, "October"),
            (11, "November"),
            (12, "December"),
        ]
    ]


DEFAULT_SYSTEM_PROFILES = [
    {
        "name": "Employee",
        "description": "Standard employee self-service access",
        "access_level": "employee",
        "dashboard_route": "/dashboard",
        "permissions": ["profile", "dashboard", "leave", "calendar", "performance", "dashboard.view", "profile.view", "profile.edit", "leave.apply", "attendance.view"],
        "is_system": True,
    },
    {
        "name": "HR Manager",
        "description": "Full HR administrative access",
        "access_level": "hr-manager",
        "dashboard_route": "/dashboard",
        "permissions": ["dashboard.view", "profile.view", "profile.edit", "staff.edit", "staff.create", "staff.view", "staff.delete", "departments.manage", "leave.manage", "leave.approve", "leave.apply", "attendance.view", "attendance.manage", "reports.view", "users.manage", "calendar.manage", "calendar.view"],
        "is_system": True,
    },
    {
        "name": "Department Head",
        "description": "Departmental oversight and approvals",
        "access_level": "department-manager",
        "dashboard_route": "/dashboard/managers/index",
        "permissions": ["dashboard.view", "profile.view", "profile.edit", "leave.apply", "leave.approve", "leave.manage"],
        "is_system": True,
    },
    {
        "name": "General Manager",
        "description": "High-level organizational oversight",
        "access_level": "department-manager",
        "dashboard_route": "/dashboard/managers/index",
        "permissions": ["dashboard.view", "profile.view", "profile.edit", "staff.edit", "staff.view", "departments.view", "leave.apply", "leave.approve", "leave.manage", "reports.view", "attendance.view", "calendar.view"],
        "is_system": True,
    },
    {
        "name": "Super Admin",
        "description": "System-wide configuration and database management",
        "access_level": "super-admin",
        "dashboard_route": "/dashboard",
        "permissions": ["dashboard.view", "profile.edit", "staff.create", "staff.delete", "departments.manage", "leave.approve", "attendance.view", "reports.view", "calendar.manage", "roles.manage", "users.manage", "calendar.view", "attendance.manage", "leave.manage", "leave.apply", "departments.view", "staff.edit", "staff.view", "profile.view"],
        "is_system": True,
    },
]


def seed_if_empty() -> None:
    db = SessionLocal()
    try:
        super_admin = (
            db.query(models.User)
            .filter(models.User.email == INITIAL_SUPER_ADMIN["email"])
            .first()
        )

        if not super_admin:
            db.add(models.User(**INITIAL_SUPER_ADMIN))

        # Seed default role access profiles
        for profile_data in DEFAULT_SYSTEM_PROFILES:
            existing_profile = (
                db.query(models.RoleAccessProfile)
                .filter(models.RoleAccessProfile.name == profile_data["name"])
                .first()
            )
            if not existing_profile:
                db.add(models.RoleAccessProfile(**profile_data))

        existing_calendar_titles = {
            row[0]
            for row in db.query(models.CalendarEvent.title).all()
            if row and row[0]
        }
        for event_payload in _build_current_year_calendar_events():
            if event_payload["title"] not in existing_calendar_titles:
                db.add(models.CalendarEvent(**event_payload))

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed_if_empty()

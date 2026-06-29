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

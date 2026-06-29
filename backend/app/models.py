from sqlalchemy import Boolean, Column, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    department = Column(String, default="General")
    role = Column(String, default="staff")  # super-admin | hr-manager | line-manager | dept-head | staff
    access_level = Column(String, default="self-service")
    dashboard_route = Column(String, default="/my-profile")
    allowed_sections = Column(JSON, default=list)
    is_active = Column(Boolean, default=True)


class RoleAccessProfile(Base):
    __tablename__ = "role_access_profiles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(String)
    access_level = Column(String, nullable=False)
    dashboard_route = Column(String, nullable=False, default="/index")
    permissions = Column(JSON, default=list)
    is_system = Column(Boolean, default=False)


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    head = Column(String)
    staff_count = Column(Integer, default=0)
    approval_level = Column(String, default="1-Step Approval")
    status = Column(String, default="Active")
    icon = Column(String)
    icon_bg = Column(String)
    avatar_color = Column(String, default="bg-slate-200 dark:bg-slate-700")
    line_manager = Column(String)
    hr_manager = Column(String)

    employees = relationship("Employee", back_populates="department")


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, unique=True)
    initials = Column(String(5))
    name = Column(String, nullable=False)
    started_at = Column(String)
    role = Column(String)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    contact = Column(String)
    status = Column(String, default="Active")
    avatar = Column(String)
    reporting = Column(JSON)  # list of strings e.g. ["Sarah Smith (LM)", "Michael Chen (DH)"]
    first_name = Column(String)
    last_name = Column(String)
    gender = Column(String)
    date_of_birth = Column(String)
    nationality = Column(String)
    marital_status = Column(String)
    profile_photo = Column(String)
    national_id = Column(String)
    personal_email = Column(String)
    work_email = Column(String)
    emergency_contact_name = Column(String)
    emergency_contact_phone = Column(String)
    emergency_contact_relationship = Column(String)
    address_city = Column(String)
    address_district = Column(String)
    address_country = Column(String)
    address_line1 = Column(String)
    employee_code = Column(String)
    employment_type = Column(String)
    date_of_joining = Column(String)
    work_location = Column(String)
    salary = Column(String)
    pay_grade = Column(String)
    salary_benefits = Column(String)
    bank_account = Column(String)
    account_names = Column(String)
    bank_name = Column(String)
    bank_details = Column(String)
    tax_id = Column(String)
    nssf_number = Column(String)
    cv_document = Column(String)
    contract_document = Column(String)
    id_copy_document = Column(String)
    certificates_document = Column(String)
    other_documents = Column(String)

    department = relationship("Department", back_populates="employees")
    attendance_records = relationship("AttendanceRecord", back_populates="employee")
    monthly_attendances = relationship("MonthlyAttendance", back_populates="employee")
    performance_metrics = relationship("PerformanceMetric", back_populates="employee")
    documents = relationship("Document", back_populates="employee")


class Holiday(Base):
    __tablename__ = "holidays"

    id = Column(Integer, primary_key=True, index=True)
    day = Column(String)    # "Monday"
    date = Column(String)   # "15 Jan" (display string)
    name = Column(String, nullable=False)
    type = Column(String, default="Gazetted Holiday")


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    date = Column(String)               # "13 Oct, 2023"
    day = Column(String)                # "Fri"
    check_in = Column(String)           # scheduled check-in time
    check_out = Column(String)          # scheduled check-out time
    clock_in = Column(String)           # actual clock-in time
    clock_out = Column(String)          # actual clock-out time
    meal_break = Column(String)         # "1.00 Hrs"
    total_hours = Column(String)        # total calculated hours
    work_hours = Column(String)         # "8.00 Hrs" (display)
    work_hours_val = Column(Float, default=0.0)  # numeric, used for aggregation
    overtime = Column(String)           # "0.00 Hrs"
    approval_status = Column(String, default="Approved")  # Approved | Rejected | Pending

    employee = relationship("Employee", back_populates="attendance_records")


class MonthlyAttendance(Base):
    """One row per employee per month; days is a 30-element JSON array of 'P'/'A'/'-'."""

    __tablename__ = "monthly_attendance"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    employee_name = Column(String)
    month_year = Column(String)  # "2026-03"
    days = Column(JSON)          # ["P", "A", "-", "-", ...]

    employee = relationship("Employee", back_populates="monthly_attendances")


class RosterEntry(Base):
    """Weekly roster snapshot per employee (five-day view)."""

    __tablename__ = "roster_entries"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    employee_name = Column(String)
    initials = Column(String(5))
    week_label = Column(String)   # e.g. "2026-03-16"
    statuses = Column(JSON)       # ["present", "present", "al", "al", "al"]


class PerformanceReview(Base):
    __tablename__ = "performance_reviews"

    id = Column(Integer, primary_key=True, index=True)
    employee = Column(String, nullable=False)
    reviewer = Column(String)
    period = Column(String)
    score = Column(String)
    outcome = Column(String)


class ReviewCycle(Base):
    """HR-created review cycle targeting a department."""
    __tablename__ = "review_cycles"

    from sqlalchemy import Text

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    department = Column(String, nullable=False)
    deadline = Column(String)           # ISO date string e.g. "2025-06-30"
    document_filename = Column(String)  # original filename
    document_data = Column(String)      # base64-encoded file content
    status = Column(String, default="active")   # active | closed
    # all_staff | managers | hr | all
    target_audience = Column(String, default="all_staff")
    created_by = Column(String)
    created_at = Column(String)

    submissions = relationship("ReviewSubmission", back_populates="cycle", cascade="all, delete-orphan")


class ReviewSubmission(Base):
    """Staff member's submission for a review cycle."""
    __tablename__ = "review_submissions"

    id = Column(Integer, primary_key=True, index=True)
    cycle_id = Column(Integer, ForeignKey("review_cycles.id"), nullable=False)
    employee_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    employee_name = Column(String, nullable=False)
    department = Column(String)
    document_filename = Column(String)
    document_data = Column(String)      # base64-encoded submitted form
    submitted_at = Column(String)

    # Manager assessment
    status = Column(String, default="submitted")  # submitted | assessed | scored
    manager_comment = Column(String)
    manager_assessed_by = Column(String)
    manager_assessed_at = Column(String)

    # HR scoring
    hr_score = Column(Float, nullable=True)
    hr_notes = Column(String)
    hr_scored_by = Column(String)
    hr_scored_at = Column(String)

    cycle = relationship("ReviewCycle", back_populates="submissions")


class ReviewTemplate(Base):
    __tablename__ = "review_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    audience = Column(String)
    age = Column(String)
    tag = Column(String)
    icon = Column(String)
    tone = Column(String)


class LeaveApplication(Base):
    __tablename__ = "leave_applications"

    id = Column(Integer, primary_key=True, index=True)
    employee_name = Column(String)
    leave_type = Column(String, nullable=False)
    reason = Column(String)
    days = Column(Integer, default=1)
    from_date = Column(String)
    to_date = Column(String)
    reviewer = Column(String)
    submitted_on = Column(String)
    department = Column(String)
    submitted_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String, default="Pending")  # Draft | Approved | Pending | Declined
    stand_in = Column(String, nullable=True)     # Name of the stand-in colleague
    handover_report = Column(Text, nullable=True)
    handover_submitted_on = Column(String, nullable=True)


class MarkedDate(Base):
    __tablename__ = "marked_dates"

    id = Column(Integer, primary_key=True, index=True)
    dates = Column(JSON)          # [4, 7, 15]
    marked_on = Column(String)    # "2026-03-01"
    status = Column(String, default="Available")  # Available | Applied


class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id = Column(Integer, primary_key=True, index=True)
    employee = Column(String, nullable=False)
    period = Column(String)
    approver = Column(String)
    status = Column(String, default="Pending")  # Pending | Approved | Rejected


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    start_date = Column(String)    # "2026-03-21"
    end_date = Column(String, nullable=True)   # "2026-03-25" – for ranged events
    class_names = Column(JSON)     # ["!text-primary"]
    employee_name = Column(String, nullable=True)
    department = Column(String, nullable=True)
    event_type = Column(String, default="event")   # "event" | "leave"
    leave_application_id = Column(Integer, ForeignKey("leave_applications.id"), nullable=True)


class ExternalEvent(Base):
    __tablename__ = "external_events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    class_name = Column(String)   # "!text-success"


class PerformanceMetric(Base):
    """Per-employee performance breakdown metrics (used in My Profile)."""

    __tablename__ = "performance_metrics"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    label = Column(String)
    score = Column(String)        # "4.9/5.0"
    percentage = Column(Integer)  # 98

    employee = relationship("Employee", back_populates="performance_metrics")


class Document(Base):
    """Employee documents (used in My Profile)."""

    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    name = Column(String)
    size = Column(String)         # "PDF • 1.3 MB"
    icon = Column(String)         # Iconify icon name

    employee = relationship("Employee", back_populates="documents")

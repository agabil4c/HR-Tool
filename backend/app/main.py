import json
import ipaddress
import logging
import os
import urllib.error
import urllib.request
from datetime import date
from functools import lru_cache
from typing import Literal

from dotenv import load_dotenv

# Load environment variables from project root .env if present
root_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
if os.path.exists(root_env):
    load_dotenv(root_env)
else:
    load_dotenv()

from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func

from . import crud, models
from .database import SessionLocal, get_db
from .seed import seed_if_empty

app = FastAPI(title="HR Tool API", version="1.0.0")
logger = logging.getLogger("uvicorn.error")

raw_origins = os.getenv("CORS_ORIGINS", "")
if raw_origins:
    origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
else:
    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LeaveApplicationCreate(BaseModel):
    leaveType: str = Field(min_length=2)
    reason: str = Field(min_length=2)
    from_date: str = Field(alias="from")
    to_date: str = Field(alias="to")
    reviewer: str


class LeaveApprovalAction(BaseModel):
    action: Literal["Approved", "Rejected"]


class DraftLeaveCreate(BaseModel):
    fromDate: str
    toDate: str
    leaveType: str = "Annual Leave"


class SubmitLeaveRequest(BaseModel):
    leaveType: str | None = None
    reason: str | None = None
    standIn: str | None = None


class UpdatePendingLeaveRequest(BaseModel):
    leaveType: str | None = None
    reason: str | None = None
    standIn: str | None = None


class SubmitHandoverReportRequest(BaseModel):
    report: str = Field(min_length=10, max_length=5000)


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    token: str
    role: str
    fullName: str
    department: str
    accessLevel: str
    dashboardRoute: str
    allowedSections: list[str]


class RoleAccessProfileCreate(BaseModel):
    name: str = Field(min_length=3)
    description: str = ""
    accessLevel: str = Field(min_length=2)
    dashboardRoute: str = Field(min_length=1)
    permissions: list[str] = Field(default_factory=list)


class RoleAccessProfileUpdate(BaseModel):
    name: str = Field(min_length=3)
    description: str = ""
    accessLevel: str = Field(min_length=2)
    dashboardRoute: str = Field(min_length=1)
    permissions: list[str] = Field(default_factory=list)


class RoleAccessProfileResponse(BaseModel):
    id: int
    name: str
    description: str
    accessLevel: str
    dashboardRoute: str
    permissions: list[str]
    isSystem: bool


class RoleAccessProfileOptionResponse(BaseModel):
    name: str
    accessLevel: str
    dashboardRoute: str


class UserCreateRequest(BaseModel):
    email: str
    password: str = Field(min_length=6)
    fullName: str = Field(min_length=2)
    department: str = Field(default="General", min_length=1)
    roleProfileName: str | None = None
    role: str | None = None
    accessLevel: str | None = None
    dashboardRoute: str | None = None
    allowedSections: list[str] | None = None
    isActive: bool = True


class UserUpdateRequest(BaseModel):
    email: str = Field(min_length=5)
    fullName: str = Field(min_length=2)
    department: str = Field(default="General", min_length=1)
    role: str = Field(default="staff", min_length=2)
    accessLevel: str = Field(default="self-service", min_length=2)
    dashboardRoute: str | None = None
    allowedSections: list[str] = Field(default_factory=list)
    isActive: bool = True


class UserResponse(BaseModel):
    id: int
    email: str
    fullName: str
    department: str
    role: str
    accessLevel: str
    dashboardRoute: str
    allowedSections: list[str]
    isActive: bool


class UserListResponse(BaseModel):
    items: list[UserResponse]
    total: int
    page: int
    pageSize: int


class DepartmentCreateRequest(BaseModel):
    name: str = Field(min_length=2)
    head: str = ""
    lineManager: str = ""
    hrManager: str = ""
    staffCount: int = 0
    initialLeaveDays: int | None = None
    approvalLevel: str = "1-Step Approval"
    status: str = "Active"
    icon: str = "solar:buildings-3-bold-duotone"
    iconBg: str = "bg-primary/10 text-primary"
    avatarColor: str = "bg-slate-200 dark:bg-slate-700"


class DepartmentUpdateRequest(BaseModel):
    name: str = Field(min_length=2)
    head: str = ""
    lineManager: str = ""
    hrManager: str = ""
    staffCount: int = 0
    initialLeaveDays: int | None = None
    approvalLevel: str = "1-Step Approval"
    status: str = "Active"
    icon: str = "solar:buildings-3-bold-duotone"
    iconBg: str = "bg-primary/10 text-primary"
    avatarColor: str = "bg-slate-200 dark:bg-slate-700"


class DepartmentResponse(BaseModel):
    id: int
    name: str
    head: str
    lineManager: str
    hrManager: str
    staffCount: int
    initialLeaveDays: int
    approvalLevel: str
    status: str
    icon: str
    iconBg: str
    avatarColor: str


class HrEmployeeUpdateRequest(BaseModel):
    firstName: str = ""
    lastName: str = ""
    gender: str = ""
    dateOfBirth: str = ""
    nationality: str = ""
    maritalStatus: str = ""
    nationalId: str = ""
    personalEmail: str = ""
    workEmail: str = ""
    phone: str = ""
    emergencyContactName: str = ""
    emergencyContactPhone: str = ""
    emergencyContactRelationship: str = ""
    addressCity: str = ""
    addressDistrict: str = ""
    addressCountry: str = ""
    addressLine1: str = ""
    employeeId: str = ""
    jobTitle: str = ""
    employmentType: str = ""
    dateOfJoining: str = ""
    workLocation: str = ""
    status: str = ""
    salary: str = ""
    payGrade: str = ""
    salaryBenefits: str = ""
    bankAccount: str = ""
    accountNames: str = ""
    bankName: str = ""
    bankDetails: str = ""
    taxId: str = ""
    nssfNumber: str = ""
    # Hierarchy fields — use None to mean "don't change", "" to clear
    lineManager: str | None = None
    departmentHead: str | None = None


class EmployeeOnboardingCreateRequest(BaseModel):
    firstName: str = Field(min_length=2)
    lastName: str = Field(min_length=2)
    fullName: str = Field(min_length=2)
    gender: str = ""
    dateOfBirth: str = ""
    nationality: str = ""
    maritalStatus: str = ""
    profilePhoto: str = ""
    nationalId: str = ""
    personalEmail: str = Field(min_length=5)
    workEmail: str = ""
    phone: str = ""
    emergencyContactName: str = ""
    emergencyContactPhone: str = ""
    emergencyContactRelationship: str = ""
    addressCity: str = ""
    addressDistrict: str = ""
    addressCountry: str = ""
    addressLine1: str = ""
    employeeId: str = ""
    department: str = ""
    jobTitle: str = Field(min_length=2)
    roleProfileName: str = Field(min_length=2)
    reportingManager: str = ""
    lineManager: str = ""
    departmentHead: str = ""
    employmentType: str = ""
    dateOfJoining: str = ""
    workLocation: str = ""
    status: str = "Active"
    salary: str = ""
    payGrade: str = ""
    salaryBenefits: str = ""
    bankAccount: str = ""
    accountNames: str = ""
    bankName: str = ""
    bankDetails: str = ""
    taxId: str = ""
    nssfNumber: str = ""
    cvDocument: str = ""
    contractDocument: str = ""
    idCopyDocument: str = ""
    certificatesDocument: str = ""
    otherDocuments: str = ""
    temporaryPassword: str | None = None


class EmployeeOnboardingResponse(BaseModel):
    employeeId: int
    userId: int
    employeeName: str
    email: str
    role: str
    department: str
    temporaryPassword: str


class PublicHolidayCreateRequest(BaseModel):
    name: str = Field(min_length=2)
    date: str = Field(min_length=8, description="Date in YYYY-MM-DD format")
    type: str = "Gazetted Holiday"


class PublicHolidayUpdateRequest(BaseModel):
    name: str = Field(min_length=2)
    date: str = Field(min_length=8, description="Date in YYYY-MM-DD format")
    type: str = "Gazetted Holiday"


class AnnualHolidaySyncRequest(BaseModel):
    year: int = Field(ge=1970, le=2100)
    countryCode: str | None = Field(default=None, min_length=2, max_length=3)
    regionCode: str | None = None
    includeGlobal: bool = True


class CalendarEventCreateRequest(BaseModel):
    title: str = Field(min_length=2)
    start: str = Field(min_length=8, description="Date in YYYY-MM-DD format")
    classNames: list[str] = Field(default_factory=list)


class CalendarEventUpdateRequest(BaseModel):
    title: str = Field(min_length=2)
    start: str | None = Field(default=None, min_length=8, description="Date in YYYY-MM-DD format")
    classNames: list[str] = Field(default_factory=list)


AUTH_EXEMPT_PATHS = {
    "/api/v1/health",
    "/api/v1/auth/login",
}

MODULE_PERMISSION_MAP = {
    "hr-dashboard": "dashboard",
    "staff-biodata": "staff",
    "department": "departments",
    "holidays": "leave",
    "attendance": "attendance",
    "attendance-main": "attendance",
    "performance-reviews": "reports",
    "dashboard": "profile",
    "my-bio": "profile",
    "leave-requests": "leave",
    "calendar": "calendar",
}

DEFAULT_ALLOWED_BY_ROLE = {
    "super-admin": ["*"],
    "hr-manager": ["dashboard", "profile", "staff", "departments", "leave", "attendance", "reports", "calendar", "user-admin"],
    "hr-officer": ["dashboard", "profile", "staff", "departments", "leave", "attendance", "reports", "calendar"],
    "department-manager": ["dashboard", "profile", "staff", "departments", "leave", "attendance", "reports", "calendar"],
    "line-manager": ["dashboard", "profile", "staff", "departments", "leave", "attendance", "reports", "calendar"],
    "dept-head": ["dashboard", "profile", "staff", "departments", "leave", "attendance", "reports", "calendar"],
    "department-head": ["dashboard", "profile", "staff", "departments", "leave", "attendance", "reports", "calendar"],
    "general-manager": ["dashboard", "profile", "staff", "departments", "leave", "attendance", "reports", "calendar"],
    "staff": ["dashboard", "profile", "leave", "attendance", "reports", "calendar"],
    "employee": ["dashboard", "profile", "leave", "attendance", "reports", "calendar"],
}

PERMISSION_ALIASES = {
    "reports": {"performance"},
    "performance": {"reports"},
}

STAFF_ROLE_ALIASES = {"staff", "employee"}


@app.on_event("startup")
def initialize_bootstrap_data() -> None:
    db = SessionLocal()
    try:
        crud.ensure_employee_extended_fields(db)
        crud.ensure_leave_handover_fields(db)
    finally:
        db.close()
    seed_if_empty()


def _extract_user_id_from_token(token: str) -> int | None:
    if not token.startswith("dev-token-"):
        return None
    raw_id = token.removeprefix("dev-token-")
    return int(raw_id) if raw_id.isdigit() else None


def _normalize_role(role: str | None) -> str:
    import re
    return re.sub(r'[\s_]+', '-', (role or "").strip().lower())


def _has_permission(user: models.User, permission: str) -> bool:
    if _normalize_role(user.role) == "super-admin":
        return True
    allowed_sections = user.allowed_sections or []

    # Backward compatibility: older rows may store JSON arrays as strings.
    if isinstance(allowed_sections, str):
        try:
            parsed_sections = json.loads(allowed_sections)
            allowed_sections = parsed_sections if isinstance(parsed_sections, list) else []
        except json.JSONDecodeError:
            allowed_sections = []

    # Always merge in the role-level defaults so that stale/partial
    # allowed_sections entries don't silently block baseline permissions.
    role_defaults = DEFAULT_ALLOWED_BY_ROLE.get(_normalize_role(user.role), [])
    effective_sections = set(allowed_sections) | set(role_defaults)

    if "*" in effective_sections or permission in effective_sections:
        return True

    aliases = PERMISSION_ALIASES.get(permission, set())
    return any(alias in effective_sections for alias in aliases)


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    request.state.current_user = None

    if request.method == "OPTIONS":
        return await call_next(request)

    path = request.url.path
    if not path.startswith("/api/v1") or path in AUTH_EXEMPT_PATHS:
        return await call_next(request)

    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"detail": "Missing or invalid authorization header"})

    token = auth_header.split(" ", 1)[1].strip()
    user_id = _extract_user_id_from_token(token)
    if not user_id:
        return JSONResponse(status_code=401, content={"detail": "Invalid token"})

    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            return JSONResponse(status_code=401, content={"detail": "User not found"})
        if not user.is_active:
            return JSONResponse(status_code=403, content={"detail": "This user account is inactive"})
        request.state.current_user = user
    finally:
        db.close()

    return await call_next(request)


def get_current_user(request: Request) -> models.User:
    user = getattr(request.state, "current_user", None)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user


def require_permission(permission: str):
    def _dependency(user: models.User = Depends(get_current_user)) -> models.User:
        if not _has_permission(user, permission):
            raise HTTPException(status_code=403, detail=f"Permission '{permission}' is required")
        return user

    return _dependency


def require_any_permission(*permissions: str):
    def _dependency(user: models.User = Depends(get_current_user)) -> models.User:
        if any(_has_permission(user, permission) for permission in permissions):
            return user

        joined = ", ".join(sorted(set(permissions)))
        raise HTTPException(status_code=403, detail=f"One of these permissions is required: {joined}")

    return _dependency


def require_super_admin(user: models.User = Depends(get_current_user)) -> models.User:
    if _normalize_role(user.role) != "super-admin":
        raise HTTPException(status_code=403, detail="Only Super Admin can perform this action")
    return user


def require_manager_for_leave_actions(user: models.User = Depends(get_current_user)) -> models.User:
    if (user.role or "").strip().lower() in STAFF_ROLE_ALIASES:
        raise HTTPException(status_code=403, detail="This action is available to managers only")
    return user


def require_staff_onboarding_access(user: models.User = Depends(get_current_user)) -> models.User:
    if not _has_permission(user, "staff"):
        raise HTTPException(status_code=403, detail="Permission 'staff' is required to onboard employees")
    return user


def require_module_permission(module_key: str, user: models.User = Depends(get_current_user)) -> models.User:
    permission = MODULE_PERMISSION_MAP.get(module_key)
    if permission and not _has_permission(user, permission):
        raise HTTPException(status_code=403, detail="You are not allowed to access this module")
    return user


@lru_cache(maxsize=1)
def _get_trusted_proxy_networks() -> tuple[ipaddress._BaseNetwork, ...]:
    raw_value = os.getenv("TRUSTED_PROXY_IPS", "").strip()
    if not raw_value:
        return (
            ipaddress.ip_network("127.0.0.1/32", strict=False),
            ipaddress.ip_network("::1/128", strict=False),
        )

    networks: list[ipaddress._BaseNetwork] = []
    for item in raw_value.split(","):
        candidate = item.strip()
        if not candidate:
            continue

        try:
            if "/" in candidate:
                networks.append(ipaddress.ip_network(candidate, strict=False))
            else:
                parsed_ip = ipaddress.ip_address(candidate)
                suffix = "/32" if parsed_ip.version == 4 else "/128"
                networks.append(ipaddress.ip_network(f"{candidate}{suffix}", strict=False))
        except ValueError:
            continue

    return tuple(networks)


def _is_trusted_proxy(ip_address: str | None) -> bool:
    if not ip_address:
        return False

    try:
        parsed_ip = ipaddress.ip_address(ip_address)
    except ValueError:
        return False

    return any(parsed_ip in network for network in _get_trusted_proxy_networks())


def _extract_client_ip(request: Request) -> str | None:
    direct_client_ip = request.client.host if request.client else None

    if _is_trusted_proxy(direct_client_ip):
        x_forwarded_for = request.headers.get("X-Forwarded-For")
        if x_forwarded_for:
            forwarded_ip = x_forwarded_for.split(",")[0].strip()
            if forwarded_ip:
                return forwarded_ip

        real_ip = request.headers.get("X-Real-IP", "").strip()
        if real_ip:
            return real_ip

    return direct_client_ip

def _fetch_json(url: str, timeout: int = 5) -> dict | None:
    try:
        with urllib.request.urlopen(url, timeout=timeout) as response:
            payload = json.loads(response.read().decode("utf-8"))
            logger.info("_fetch_json url=%s payload=%s", url, payload)
            return payload
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        logger.warning("_fetch_json failed url=%s error=%s", url, exc)
        return None

def _lookup_country_code_by_ip(ip_address: str | None) -> str | None:
    if not ip_address:
        logger.info("_lookup_country_code_by_ip skipped because no ip_address was provided")
        return None

    # Validate IP
    try:
        parsed_ip = ipaddress.ip_address(ip_address)
        if parsed_ip.is_private or parsed_ip.is_loopback:
            logger.info("_lookup_country_code_by_ip skipped private_or_loopback ip=%s", ip_address)
            return None
    except ValueError:
        logger.warning("_lookup_country_code_by_ip invalid ip=%s", ip_address)
        return None

    # --- 1. Primary: ipwho.is ---
    data = _fetch_json(f"https://ipwho.is/{ip_address}")
    if data and data.get("success") and data.get("country_code"):
        country_code = data["country_code"].upper()
        logger.info("_lookup_country_code_by_ip provider=ipwho.is ip=%s country_code=%s", ip_address, country_code)
        return country_code

    # --- 2. Fallback: ipapi.co ---
    data = _fetch_json(f"https://ipapi.co/{ip_address}/json/")
    if data and data.get("country"):
        country_code = data["country"].upper()
        logger.info("_lookup_country_code_by_ip provider=ipapi.co ip=%s country_code=%s", ip_address, country_code)
        return country_code

    logger.info("_lookup_country_code_by_ip no_country_found ip=%s", ip_address)
    return None


# @lru_cache(maxsize=1000)
# def cached_lookup(ip_address: str | None) -> str | None:
#     return _lookup_country_code_by_ip(ip_address)
def cached_lookup(ip_address: str | None) -> str | None:
    if not ip_address:
        return None

    try:
        parsed_ip = ipaddress.ip_address(ip_address)
        if parsed_ip.is_private or parsed_ip.is_loopback:
            return None
    except ValueError:
        return None

    return _cached_lookup_internal(ip_address)


@lru_cache(maxsize=1000)
def _cached_lookup_internal(ip_address: str) -> str | None:
    return _lookup_country_code_by_ip(ip_address)


@app.get("/api/v1/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/v1/auth/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    if not payload.email or not payload.password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    user = crud.get_user_by_email(db, payload.email)
    if not user or user.password_hash != payload.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="This user account is inactive")

    return LoginResponse(token=f"dev-token-{user.id}", **crud.build_user_session_payload(user))


@app.put("/api/v1/auth/change-password", response_model=dict)
def change_password(
    payload: dict,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    current_password = payload.get("currentPassword")
    new_password = payload.get("newPassword")

    if not current_password or not new_password:
        raise HTTPException(status_code=400, detail="Current and new password are required")

    if user.password_hash != current_password:
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    user.password_hash = new_password
    db.commit()
    return {"message": "Password changed successfully"}


@app.get("/api/v1/admin/role-access-profiles", response_model=list[RoleAccessProfileResponse])
def get_role_access_profiles(
    _: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[RoleAccessProfileResponse]:
    return [RoleAccessProfileResponse(**item) for item in crud.get_role_access_profiles(db)]


@app.post("/api/v1/admin/role-access-profiles", response_model=RoleAccessProfileResponse)
def create_role_access_profile(
    payload: RoleAccessProfileCreate,
    _: models.User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> RoleAccessProfileResponse:
    created = crud.create_role_access_profile(
        db,
        {
            "name": payload.name,
            "description": payload.description,
            "accessLevel": payload.accessLevel,
            "dashboardRoute": payload.dashboardRoute,
            "permissions": payload.permissions,
        },
    )
    if not created:
        raise HTTPException(status_code=409, detail="A role/access profile with that name already exists")
    return RoleAccessProfileResponse(**created)


@app.put("/api/v1/admin/role-access-profiles/{role_profile_id}", response_model=RoleAccessProfileResponse)
def update_role_access_profile(
    role_profile_id: int,
    payload: RoleAccessProfileUpdate,
    _: models.User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> RoleAccessProfileResponse:
    updated = crud.update_role_access_profile(
        db,
        role_profile_id,
        {
            "name": payload.name,
            "description": payload.description,
            "accessLevel": payload.accessLevel,
            "dashboardRoute": payload.dashboardRoute,
            "permissions": payload.permissions,
        },
    )
    if updated is None:
        raise HTTPException(status_code=404, detail="Role/access profile not found")
    if updated == {}:
        raise HTTPException(status_code=409, detail="A role/access profile with that name already exists")
    if updated.get("error") == "system-profile-immutable":
        raise HTTPException(status_code=403, detail="System role/access profiles cannot be modified")
    return RoleAccessProfileResponse(**updated)


@app.delete("/api/v1/admin/role-access-profiles/{role_profile_id}")
def delete_role_access_profile(
    role_profile_id: int,
    _: models.User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    deleted = crud.delete_role_access_profile(db, role_profile_id)
    if deleted is None:
        raise HTTPException(status_code=404, detail="Role/access profile not found")
    if deleted.get("error") == "system-profile-immutable":
        raise HTTPException(status_code=403, detail="System role/access profiles cannot be deleted")
    if deleted.get("error") == "role-in-use":
        raise HTTPException(
            status_code=409,
            detail=f"Role/access profile is in use by {deleted.get('usersCount', 0)} user(s)",
        )
    return {"deleted": True}


@app.get("/api/v1/admin/role-access-profiles/options", response_model=list[RoleAccessProfileOptionResponse])
def get_role_access_profile_options(
    _: models.User = Depends(require_permission("staff")),
    db: Session = Depends(get_db),
) -> list[RoleAccessProfileOptionResponse]:
    return [RoleAccessProfileOptionResponse(**item) for item in crud.get_role_access_profile_options(db)]


@app.get("/api/v1/modules/{module_key}")
def get_module_data(
    module_key: str,
    user: models.User = Depends(require_module_permission),
    db: Session = Depends(get_db),
    year: int | None = None,
    month: int | None = None,
) -> dict:
    data = crud.get_module_data(db, module_key, user, year=year, month=month)
    if not data:
        raise HTTPException(status_code=404, detail="Module data not found")
    return data


@app.post("/api/v1/hr/attendance/upload", response_model=dict)
async def upload_attendance_excel(
    employee_id: int = Form(..., alias="employeeId"),
    from_date_raw: str = Form(..., alias="fromDate"),
    to_date_raw: str = Form(..., alias="toDate"),
    staff_name: str = Form("", alias="staffName"),
    file: UploadFile = File(...),
    user: models.User = Depends(require_permission("attendance")),
    db: Session = Depends(get_db),
) -> dict:
    role = _normalize_role(user.role)
    if role not in {"super-admin", "hr-manager", "hr-officer"}:
        raise HTTPException(status_code=403, detail="Only HR or Super Admin can upload attendance files")

    try:
        from_date = date.fromisoformat(from_date_raw)
        to_date = date.fromisoformat(to_date_raw)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="fromDate and toDate must be YYYY-MM-DD") from exc

    if to_date < from_date:
        raise HTTPException(status_code=400, detail="toDate must not be before fromDate")

    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    filename = (file.filename or "").lower()
    if not (
        filename.endswith(".xlsx")
        or filename.endswith(".xlsm")
        or filename.endswith(".xltx")
        or filename.endswith(".csv")
    ):
        raise HTTPException(status_code=400, detail="Upload a valid Excel/CSV file (.xlsx or .csv)")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    try:
        result = crud.import_attendance_from_excel(
            db,
            employee=employee,
            from_date=from_date,
            to_date=to_date,
            file_bytes=content,
            file_name=filename,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return result


@app.get("/api/v1/hr/leave-planner/calendar-cells")
def get_calendar_cells(
    user: models.User = Depends(require_permission("leave")),
    db: Session = Depends(get_db),
    year: int | None = None,
    month: int | None = None,
) -> list[dict]:
    if month is not None and (month < 1 or month > 12):
        raise HTTPException(status_code=400, detail="month must be between 1 and 12")

    return crud.get_leave_calendar_cells(db, user=user, year=year, month=month)


@app.post("/api/v1/hr/leave-planner/draft")
def create_draft_leave(
    payload: DraftLeaveCreate,
    user: models.User = Depends(require_permission("leave")),
    db: Session = Depends(get_db),
) -> dict:
    try:
        from_d = date.fromisoformat(payload.fromDate)
        to_d = date.fromisoformat(payload.toDate)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="fromDate and toDate must be YYYY-MM-DD") from exc
    if to_d < from_d:
        raise HTTPException(status_code=400, detail="toDate must not be before fromDate")
    result = crud.create_draft_leave(
        db,
        {"fromDate": from_d.isoformat(), "toDate": to_d.isoformat(), "leaveType": payload.leaveType},
        user,
    )
    if isinstance(result, str) and result.startswith("conflict:"):
        parts = result.split(":", 3)
        colleague = parts[1] if len(parts) > 1 else "A colleague"
        raise HTTPException(
            status_code=409,
            detail=f"Date conflict: {colleague} in your department already has leave covering these dates.",
        )
    return result


@app.get("/api/v1/hr/leave-planner/drafts")
def get_draft_leaves(
    user: models.User = Depends(require_permission("leave")),
    db: Session = Depends(get_db),
) -> list[dict]:
    return crud.get_draft_leaves(db, user)


@app.delete("/api/v1/hr/leave-planner/draft/{leave_id}")
def delete_draft_leave(
    leave_id: int,
    user: models.User = Depends(require_permission("leave")),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    deleted = crud.delete_draft_leave(db, leave_id, user)
    if not deleted:
        raise HTTPException(status_code=404, detail="Draft not found or already submitted")
    return {"deleted": True}


@app.post("/api/v1/hr/leave-planner/leaves/{leave_id}/submit")
def submit_leave(
    leave_id: int,
    payload: SubmitLeaveRequest,
    user: models.User = Depends(require_permission("leave")),
    db: Session = Depends(get_db),
) -> dict:
    result = crud.submit_leave(
        db,
        leave_id,
        {"leaveType": payload.leaveType, "reason": payload.reason, "standIn": payload.standIn},
        user,
    )
    if result == "not_found":
        raise HTTPException(status_code=404, detail="Draft leave not found")
    if isinstance(result, str) and result.startswith("conflict:"):
        parts = result.split(":", 3)
        colleague = parts[1] if len(parts) > 1 else "a colleague"
        from_d = parts[2] if len(parts) > 2 else ""
        to_d = parts[3] if len(parts) > 3 else ""
        msg = f"{colleague} already has leave covering those dates ({from_d} – {to_d})"
        raise HTTPException(status_code=409, detail=msg)
    if isinstance(result, str) and result.startswith("insufficient_balance:"):
        parts = result.split(":", 2)
        requested_days = parts[1] if len(parts) > 1 else "0"
        remaining_days = parts[2] if len(parts) > 2 else "0"
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient leave balance. Requested {requested_days} day(s), remaining {remaining_days} day(s).",
        )
    return result


@app.get("/api/v1/hr/leave-planner/stand-in-options")
def get_stand_in_options(
    user: models.User = Depends(require_permission("leave")),
    db: Session = Depends(get_db),
) -> list[dict]:
    return crud.get_stand_in_options(db, user)


@app.put("/api/v1/hr/leave-planner/leaves/{leave_id}")
def update_pending_leave(
    leave_id: int,
    payload: UpdatePendingLeaveRequest,
    user: models.User = Depends(require_permission("leave")),
    db: Session = Depends(get_db),
) -> dict:
    result = crud.update_pending_leave(
        db,
        leave_id,
        {"leaveType": payload.leaveType, "reason": payload.reason, "standIn": payload.standIn},
        user,
    )
    if result == "not_found":
        raise HTTPException(status_code=404, detail="Pending leave not found")
    return result


@app.delete("/api/v1/hr/leave-planner/leaves/{leave_id}")
def delete_pending_leave(
    leave_id: int,
    user: models.User = Depends(require_permission("leave")),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    deleted = crud.delete_pending_leave(db, leave_id, user)
    if not deleted:
        raise HTTPException(status_code=404, detail="Pending leave not found or already processed")
    return {"deleted": True}


@app.post("/api/v1/hr/leave-planner/leaves/{leave_id}/handover-report")
def submit_handover_report(
    leave_id: int,
    payload: SubmitHandoverReportRequest,
    user: models.User = Depends(require_permission("leave")),
    db: Session = Depends(get_db),
) -> dict:
    result = crud.submit_handover_report(db, leave_id, payload.report, user)
    if result == "not_found":
        raise HTTPException(status_code=404, detail="Approved leave not found")
    if result == "invalid_report":
        raise HTTPException(status_code=400, detail="Hand-over report is required")
    return result


@app.post("/api/v1/hr/public-holidays")
def create_public_holiday(
    payload: PublicHolidayCreateRequest,
    _: models.User = Depends(require_permission("leave")),
    db: Session = Depends(get_db),
) -> dict:
    try:
        parsed_date = date.fromisoformat(payload.date)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Date must be in YYYY-MM-DD format") from exc

    return crud.create_public_holiday(
        db,
        {
            "name": payload.name,
            "date": parsed_date,
            "type": payload.type,
        },
    )


@app.put("/api/v1/hr/public-holidays/{holiday_id}")
def update_public_holiday(
    holiday_id: int,
    payload: PublicHolidayUpdateRequest,
    _: models.User = Depends(require_permission("leave")),
    db: Session = Depends(get_db),
) -> dict:
    try:
        parsed_date = date.fromisoformat(payload.date)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Date must be in YYYY-MM-DD format") from exc

    updated = crud.update_public_holiday(
        db,
        holiday_id,
        {
            "name": payload.name,
            "date": parsed_date,
            "type": payload.type,
        },
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Holiday not found")
    return updated


@app.delete("/api/v1/hr/public-holidays/{holiday_id}")
def delete_public_holiday(
    holiday_id: int,
    _: models.User = Depends(require_permission("leave")),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    deleted = crud.delete_public_holiday(db, holiday_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Holiday not found")
    return {"deleted": True}


@app.post("/api/v1/hr/public-holidays/import-annual")
def import_annual_public_holidays(
    payload: AnnualHolidaySyncRequest,
    request: Request,
    _: models.User = Depends(require_permission("leave")),
    db: Session = Depends(get_db),
) -> dict:
    try:
        client_ip = _extract_client_ip(request)
        logger.warning("import_annual_public_holidays called year=%s provided_country=%s client_ip=%s", payload.year, payload.countryCode, client_ip)

        country_code = (payload.countryCode or "").strip().upper() or cached_lookup(client_ip) or "UG"
        logger.warning("import_annual_public_holidays resolved_country=%s", country_code)

        return crud.sync_annual_public_holidays(
            db,
            year=payload.year,
            country_code=country_code,
            region_code=payload.regionCode,
            include_global=payload.includeGlobal,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/v1/dashboard/upcoming-events")
def get_dashboard_upcoming_events(
    _: models.User = Depends(require_permission("dashboard")),
    db: Session = Depends(get_db),
) -> list[dict]:
    return crud.get_upcoming_events_summary(db)


@app.post("/api/v1/calendar/events")
def create_calendar_event(
    payload: CalendarEventCreateRequest,
    _: models.User = Depends(require_any_permission("calendar", "leave")),
    db: Session = Depends(get_db),
) -> dict:
    try:
        parsed_date = date.fromisoformat(payload.start)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="start must be in YYYY-MM-DD format") from exc

    return crud.create_calendar_event(
        db,
        {
            "title": payload.title,
            "startDate": parsed_date.isoformat(),
            "classNames": payload.classNames,
        },
    )


@app.put("/api/v1/calendar/events/{event_id}")
def update_calendar_event(
    event_id: int,
    payload: CalendarEventUpdateRequest,
    _: models.User = Depends(require_any_permission("calendar", "leave")),
    db: Session = Depends(get_db),
) -> dict:
    start_date = None
    if payload.start is not None:
        try:
            start_date = date.fromisoformat(payload.start).isoformat()
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="start must be in YYYY-MM-DD format") from exc

    updated = crud.update_calendar_event(
        db,
        event_id,
        {
            "title": payload.title,
            "startDate": start_date,
            "classNames": payload.classNames,
        },
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Calendar event not found")
    return updated


@app.delete("/api/v1/calendar/events/{event_id}")
def delete_calendar_event(
    event_id: int,
    _: models.User = Depends(require_any_permission("calendar", "leave")),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    deleted = crud.delete_calendar_event(db, event_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Calendar event not found")
    return {"deleted": True}


@app.get("/api/v1/hr/leave-planner/leaves")
def get_leave_applications(
    user: models.User = Depends(require_permission("leave")),
    db: Session = Depends(get_db),
) -> list[dict]:
    return crud.get_leave_applications(db, user)


@app.get("/api/v1/hr/leave-planner/balance", response_model=dict)
def get_my_leave_balance(
    user: models.User = Depends(require_permission("leave")),
    db: Session = Depends(get_db),
) -> dict:
    return crud.get_user_leave_balance_summary(db, user)



@app.post("/api/v1/hr/leave-planner/leaves")
def create_leave_application(
    payload: LeaveApplicationCreate,
    user: models.User = Depends(require_permission("leave")),
    db: Session = Depends(get_db),
) -> dict:
    result = crud.create_leave_application(
        db,
        {
            "leaveType": payload.leaveType,
            "reason": payload.reason,
            "from": payload.from_date,
            "to": payload.to_date,
            "reviewer": payload.reviewer,
        },
        user,
    )
    if isinstance(result, str) and result.startswith("insufficient_balance:"):
        parts = result.split(":", 2)
        requested_days = parts[1] if len(parts) > 1 else "0"
        remaining_days = parts[2] if len(parts) > 2 else "0"
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient leave balance. Requested {requested_days} day(s), remaining {remaining_days} day(s).",
        )
    return result


@app.post("/api/v1/hr/leave-planner/leaves/{leave_id}/cancel")
def cancel_leave(
    leave_id: int,
    user: models.User = Depends(require_permission("leave")),
    db: Session = Depends(get_db),
) -> dict:
    item = crud.cancel_leave(db, leave_id, user)
    if not item:
        raise HTTPException(status_code=404, detail="Leave application not found")
    if item == {}:
        raise HTTPException(status_code=403, detail="You are not allowed to cancel this leave request")
    return item


@app.get("/api/v1/hr/leave-applications/marked-dates")
def get_marked_dates(
    _: models.User = Depends(require_permission("leave")),
    db: Session = Depends(get_db),
) -> list[dict]:
    return crud.get_marked_dates(db)


@app.post("/api/v1/hr/leave-applications/marked-dates/{marked_id}/apply")
def apply_marked_dates(
    marked_id: int,
    _: models.User = Depends(require_permission("leave")),
    db: Session = Depends(get_db),
) -> dict:
    item = crud.apply_marked_dates(db, marked_id)
    if not item:
        raise HTTPException(status_code=404, detail="Marked date set not found")
    return item


@app.get("/api/v1/hr/leave-applications/approvals")
def get_approvals(
    user: models.User = Depends(require_manager_for_leave_actions),
    db: Session = Depends(get_db),
) -> list[dict]:
    return crud.get_approvals(db, user)


@app.post("/api/v1/hr/leave-applications/approvals/{approval_id}")
def action_approval(
    approval_id: int,
    payload: LeaveApprovalAction,
    _: models.User = Depends(require_manager_for_leave_actions),
    db: Session = Depends(get_db),
) -> dict:
    item = crud.action_approval(db, approval_id, payload.action)
    if not item:
        raise HTTPException(status_code=404, detail="Pending leave application not found")
    return item


@app.get("/api/v1/admin/users", response_model=UserListResponse)
def get_users(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
    q: str | None = None,
    status: str | None = None,
    page: int = 1,
    pageSize: int = 20,
) -> UserListResponse:
    role = _normalize_role(current_user.role)
    if role != "super-admin" and role not in {"hr-manager", "hr-officer"}:
        raise HTTPException(status_code=403, detail="Access restricted to HR and administrators")
    payload = crud.list_users(db, q=q, status=status, page=page, page_size=pageSize)
    return UserListResponse(
        items=[UserResponse(**item) for item in payload["items"]],
        total=payload["total"],
        page=payload["page"],
        pageSize=payload["pageSize"],
    )


@app.get("/api/v1/admin/users/{user_id}")
def get_user_overview(
    user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    role = _normalize_role(current_user.role)
    if role != "super-admin" and role not in {"hr-manager", "hr-officer"}:
        raise HTTPException(status_code=403, detail="Access restricted to HR and administrators")
    row = crud.get_user_by_id(db, user_id)
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return row


@app.put("/api/v1/admin/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    payload: UserUpdateRequest,
    current_user: models.User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> UserResponse:
    if current_user.id == user_id and not payload.isActive:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account")

    updated = crud.update_user(
        db,
        user_id,
        {
            "email": payload.email,
            "fullName": payload.fullName,
            "department": payload.department,
            "role": payload.role,
            "accessLevel": payload.accessLevel,
            "dashboardRoute": payload.dashboardRoute,
            "allowedSections": payload.allowedSections,
            "isActive": payload.isActive,
        },
    )
    if updated is None:
        raise HTTPException(status_code=404, detail="User not found")
    if updated == {}:
        raise HTTPException(status_code=409, detail="A user with this email already exists")
    if updated.get("error") == "role-profile-not-found":
        raise HTTPException(status_code=404, detail="Selected role profile was not found")

    crud.add_user_audit_log(
        db,
        action="user.updated",
        actor_user_id=current_user.id,
        actor_email=current_user.email,
        target_user_id=user_id,
        target_email=updated.get("email"),
        details={
            "fullName": payload.fullName,
            "department": payload.department,
            "role": payload.role,
            "accessLevel": payload.accessLevel,
            "dashboardRoute": payload.dashboardRoute,
            "isActive": payload.isActive,
            "allowedSections": payload.allowedSections,
        },
    )
    db.commit()

    return UserResponse(**updated)


@app.delete("/api/v1/admin/users/{user_id}")
def delete_user(
    user_id: int,
    current_user: models.User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")

    target = crud.get_user_by_id(db, user_id)
    deleted = crud.delete_user(db, user_id)
    if deleted is None:
        raise HTTPException(status_code=404, detail="User not found")

    crud.add_user_audit_log(
        db,
        action="user.deleted",
        actor_user_id=current_user.id,
        actor_email=current_user.email,
        target_user_id=user_id,
        target_email=(target or {}).get("email"),
        details={
            "fullName": (target or {}).get("fullName"),
            "department": (target or {}).get("department"),
            "role": (target or {}).get("role"),
        },
    )
    db.commit()

    return {"deleted": True}


@app.delete("/api/v1/hr/employees/{employee_id}")
def delete_employee_by_hr(
    employee_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    role = _normalize_role(current_user.role)
    if role != "super-admin" and role not in {"hr-manager", "hr-officer"}:
        raise HTTPException(status_code=403, detail="HR access required")

    target = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Employee not found")
    if target.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot remove your own employee record")

    deleted = crud.delete_employee(db, employee_id)
    if deleted is None:
        raise HTTPException(status_code=404, detail="Employee not found")

    return {"deleted": True}


@app.put("/api/v1/hr/employees/{employee_id}", response_model=dict)
def update_employee_by_hr(
    employee_id: int,
    payload: HrEmployeeUpdateRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    role = _normalize_role(current_user.role)
    if role != "super-admin" and role not in {"hr-manager", "hr-officer"}:
        raise HTTPException(status_code=403, detail="Only HR staff can update employee records")
    crud.ensure_employee_extended_fields(db)
    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    field_mapping = {
        "firstName": "first_name",
        "lastName": "last_name",
        "dateOfBirth": "date_of_birth",
        "personalEmail": "personal_email",
        "workEmail": "work_email",
        "emergencyContactName": "emergency_contact_name",
        "emergencyContactPhone": "emergency_contact_phone",
        "emergencyContactRelationship": "emergency_contact_relationship",
        "addressCity": "address_city",
        "addressDistrict": "address_district",
        "addressCountry": "address_country",
        "addressLine1": "address_line1",
        "employeeId": "employee_code",
        "jobTitle": "role",
        "employmentType": "employment_type",
        "dateOfJoining": "date_of_joining",
        "workLocation": "work_location",
        "salary": "salary",
        "payGrade": "pay_grade",
        "salaryBenefits": "salary_benefits",
        "bankAccount": "bank_account",
        "accountNames": "account_names",
        "bankName": "bank_name",
        "bankDetails": "bank_details",
        "taxId": "tax_id",
        "nssfNumber": "nssf_number",
    }
    protected = {'id', 'user_id', 'department_id', 'created_at', 'updated_at'}
    for camel, value in payload.model_dump(exclude_none=True).items():
        if camel in ('lineManager', 'departmentHead'):
            continue  # handled separately below
        if not value and value != False:  # skip empty strings
            continue
        db_field = field_mapping.get(camel, camel)
        if hasattr(employee, db_field) and db_field not in protected:
            setattr(employee, db_field, value)
    if payload.firstName or payload.lastName:
        first = payload.firstName or employee.first_name or ""
        last = payload.lastName or employee.last_name or ""
        employee.name = f"{first} {last}".strip()
        employee.initials = (first[:1] + last[:1]).upper()
    # Update reporting hierarchy when explicitly provided
    if payload.lineManager is not None or payload.departmentHead is not None:
        existing = employee.reporting or []
        lm = payload.lineManager if payload.lineManager is not None else (existing[0] if len(existing) > 0 else "")
        dh = payload.departmentHead if payload.departmentHead is not None else (existing[1] if len(existing) > 1 else "")
        new_reporting = []
        if lm and lm.strip() and lm.strip() != "__none__":
            new_reporting.append(lm.strip())
        if dh and dh.strip() and dh.strip() != "__self__":
            new_reporting.append(dh.strip())
        employee.reporting = new_reporting
    db.commit()
    return {"message": "Employee updated successfully"}


@app.post("/api/v1/hr/employees/{employee_id}/reset-password", response_model=dict)
def reset_employee_password(
    employee_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    role = _normalize_role(current_user.role)
    if role != "super-admin" and role not in {"hr-manager", "hr-officer"}:
        raise HTTPException(status_code=403, detail="Only HR staff can reset employee passwords")
    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    user = db.query(models.User).filter(models.User.id == employee.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Linked user account not found")
    import secrets, string
    alphabet = string.ascii_letters + string.digits + "@#!$"
    temp_pwd = ''.join(secrets.choice(alphabet) for _ in range(12))
    user.password_hash = temp_pwd
    db.commit()
    return {"temporaryPassword": temp_pwd}


class ProfileUpdateRequestCreate(BaseModel):
    requestedFields: list[str] = Field(default_factory=list)
    note: str = ""
    message: str | None = None


class ProfileUpdateRequestAction(BaseModel):
    action: str = Field(min_length=3)
    reviewNote: str = ""


@app.post("/api/v1/hr/profile-update-requests", response_model=dict)
def submit_profile_update_request(
    payload: ProfileUpdateRequestCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    requested_fields = [field.strip() for field in payload.requestedFields if field and field.strip()]
    note = (payload.note or "").strip()

    # Backward compatibility for existing clients still sending only `message`.
    if not requested_fields and (payload.message or "").strip():
        requested_fields = ["General profile details"]
        note = (payload.message or "").strip()

    if not requested_fields:
        raise HTTPException(status_code=422, detail="Select at least one field to update")

    result = crud.create_profile_update_request(
        db,
        requester_user_id=current_user.id,
        requester_name=current_user.full_name,
        requester_department=current_user.department or "General",
        requested_fields=requested_fields,
        note=note,
    )

    print(f"[PROFILE UPDATE REQUEST] user_id={current_user.id} | fields={', '.join(requested_fields)} | note={note}")

    # Send profile update request emails
    try:
        from app.email import send_profile_update_submitted_notification
        
        # Send confirmation to employee
        send_profile_update_submitted_notification(
            recipient_email=current_user.email,
            requester_name=current_user.full_name,
            requested_fields=requested_fields,
            note=note
        )
        
        # Send to all HR users
        hr_users = db.query(models.User).filter(models.User.role.in_(["hr-manager", "hr-officer", "super-admin"])).all()
        
        # Add in-app notifications
        crud.add_notification(
            db,
            user_id=current_user.id,
            title="Profile Update Request Submitted",
            message=f"Your profile update request for fields: {', '.join(requested_fields)} has been submitted.",
            type="profile"
        )
        for hr_u in hr_users:
            if hr_u.id != current_user.id:
                crud.add_notification(
                    db,
                    user_id=hr_u.id,
                    title="Pending Profile Update Request",
                    message=f"{current_user.full_name} submitted a profile update request for: {', '.join(requested_fields)}.",
                    type="profile"
                )

        for hr_u in hr_users:
            if hr_u.email and hr_u.email != current_user.email:
                send_profile_update_submitted_notification(
                    recipient_email=hr_u.email,
                    requester_name=current_user.full_name,
                    requested_fields=requested_fields,
                    note=note
                )
    except Exception as e:
        logger.error(f"Failed to send profile update request emails: {e}")

    return result


@app.get("/api/v1/hr/profile-update-requests", response_model=list[dict])
def get_profile_update_requests(
    status: str | None = None,
    _: models.User = Depends(require_permission("staff")),
    db: Session = Depends(get_db),
) -> list[dict]:
    return crud.list_profile_update_requests(db, status=status)


@app.post("/api/v1/hr/profile-update-requests/{request_id}/action", response_model=dict)
def process_profile_update_request(
    request_id: int,
    payload: ProfileUpdateRequestAction,
    current_user: models.User = Depends(require_permission("staff")),
    db: Session = Depends(get_db),
) -> dict:
    result = crud.process_profile_update_request(
        db,
        request_id=request_id,
        action=payload.action,
        reviewer_user_id=current_user.id,
        reviewer_name=current_user.full_name,
        review_note=payload.reviewNote,
    )
    if result is None:
        raise HTTPException(status_code=404, detail="Profile update request not found")
    if result == {}:
        raise HTTPException(status_code=400, detail="Invalid action. Use approve, reject, or in-progress")

    # Send email notification to requester
    try:
        requester_user = db.query(models.User).filter(models.User.id == result["requesterUserId"]).first()
        if requester_user:
            crud.add_notification(
                db,
                user_id=requester_user.id,
                title=f"Profile Update Request {result['status']}",
                message=f"Your profile update request for: {', '.join(result['requestedFields'])} was {result['status'].lower()} by {current_user.full_name}.",
                type="profile"
            )
        if requester_user and requester_user.email:
            from app.email import send_profile_update_processed_notification
            send_profile_update_processed_notification(
                recipient_email=requester_user.email,
                requester_name=requester_user.full_name,
                requested_fields=result["requestedFields"],
                status=result["status"],
                reviewer_name=current_user.full_name,
                review_note=payload.reviewNote
            )
    except Exception as e:
        logger.error(f"Failed to send profile update processed email: {e}")

    return result


@app.get("/api/v1/hr/profile-update-requests/{request_id}/employee", response_model=dict)
def get_profile_update_request_employee_context(
    request_id: int,
    _: models.User = Depends(require_permission("staff")),
    db: Session = Depends(get_db),
) -> dict:
    result = crud.get_profile_update_request_employee_context(db, request_id=request_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Profile update request not found")
    return result


@app.post("/api/v1/admin/users", response_model=UserResponse)
def create_user(
    payload: UserCreateRequest,
    _: models.User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> UserResponse:
    raise HTTPException(
        status_code=403,
        detail="Direct user creation is disabled. Create users through Staff Bio Data onboarding.",
    )


@app.post("/api/v1/hr/employees", response_model=EmployeeOnboardingResponse)
def create_employee_with_user(
    payload: EmployeeOnboardingCreateRequest,
    _: models.User = Depends(require_staff_onboarding_access),
    db: Session = Depends(get_db),
) -> EmployeeOnboardingResponse:
    created = crud.create_employee_with_user_account(
        db,
        {
            "firstName": payload.firstName,
            "lastName": payload.lastName,
            "fullName": payload.fullName,
            "gender": payload.gender,
            "dateOfBirth": payload.dateOfBirth,
            "nationality": payload.nationality,
            "maritalStatus": payload.maritalStatus,
            "profilePhoto": payload.profilePhoto,
            "nationalId": payload.nationalId,
            "personalEmail": payload.personalEmail,
            "workEmail": payload.workEmail,
            "email": payload.personalEmail,
            "phone": payload.phone,
            "emergencyContactName": payload.emergencyContactName,
            "emergencyContactPhone": payload.emergencyContactPhone,
            "emergencyContactRelationship": payload.emergencyContactRelationship,
            "addressCity": payload.addressCity,
            "addressDistrict": payload.addressDistrict,
            "addressCountry": payload.addressCountry,
            "addressLine1": payload.addressLine1,
            "employeeId": payload.employeeId,
            "department": payload.department,
            "jobTitle": payload.jobTitle,
            "roleProfileName": payload.roleProfileName,
            "reportingManager": payload.reportingManager,
            "lineManager": payload.lineManager,
            "departmentHead": payload.departmentHead,
            "employmentType": payload.employmentType,
            "dateOfJoining": payload.dateOfJoining,
            "workLocation": payload.workLocation,
            "status": payload.status,
            "salary": payload.salary,
            "payGrade": payload.payGrade,
            "salaryBenefits": payload.salaryBenefits,
            "bankAccount": payload.bankAccount,
            "accountNames": payload.accountNames,
            "bankName": payload.bankName,
            "bankDetails": payload.bankDetails,
            "taxId": payload.taxId,
            "nssfNumber": payload.nssfNumber,
            "cvDocument": payload.cvDocument,
            "contractDocument": payload.contractDocument,
            "idCopyDocument": payload.idCopyDocument,
            "certificatesDocument": payload.certificatesDocument,
            "otherDocuments": payload.otherDocuments,
            "temporaryPassword": payload.temporaryPassword,
        },
    )

    if created is None:
        raise HTTPException(status_code=500, detail="Failed to create employee onboarding record")
    if created == {}:
        raise HTTPException(status_code=404, detail="Department not found")
    if created.get("error") == "role-profile-not-found":
        raise HTTPException(status_code=404, detail="Role profile not found")
    if created.get("error") == "forbidden-role-profile":
        raise HTTPException(status_code=403, detail="Super Admin profile cannot be assigned through onboarding")
    if created.get("error") == "email-exists":
        raise HTTPException(status_code=409, detail="A user with this email already exists")

    return EmployeeOnboardingResponse(**created)


@app.put("/api/v1/hr/employees/self", response_model=dict)
def update_employee_self(
    payload: dict,
    user: models.User = Depends(require_permission("profile")),
    db: Session = Depends(get_db),
) -> dict:
    crud.ensure_employee_extended_fields(db)
    employee = db.query(models.Employee).filter(models.Employee.user_id == user.id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Map camelCase to snake_case
    field_mapping = {
        "firstName": "first_name",
        "lastName": "last_name",
        "dateOfBirth": "date_of_birth",
        "personalEmail": "personal_email",
        "workEmail": "work_email",
        "emergencyContactName": "emergency_contact_name",
        "emergencyContactPhone": "emergency_contact_phone",
        "emergencyContactRelationship": "emergency_contact_relationship",
        "addressCity": "address_city",
        "addressDistrict": "address_district",
        "addressCountry": "address_country",
        "addressLine1": "address_line1",
        "employeeId": "employee_code",
        "employmentType": "employment_type",
        "dateOfJoining": "date_of_joining",
        "workLocation": "work_location",
        "salary": "salary",
        "payGrade": "pay_grade",
        "salaryBenefits": "salary_benefits",
        "bankAccount": "bank_account",
        "accountNames": "account_names",
        "bankName": "bank_name",
        "bankDetails": "bank_details",
        "taxId": "tax_id",
        "nssfNumber": "nssf_number",
        "cvDocument": "cv_document",
        "contractDocument": "contract_document",
        "idCopyDocument": "id_copy_document",
        "certificatesDocument": "certificates_document",
        "otherDocuments": "other_documents",
    }

    # Update fields
    for key, value in payload.items():
        db_field = field_mapping.get(key, key)
        if hasattr(employee, db_field) and db_field not in ['id', 'user_id', 'created_at', 'updated_at']:
            setattr(employee, db_field, value)

    db.commit()
    return {"message": "Employee updated successfully"}


@app.get("/api/v1/admin/departments", response_model=list[DepartmentResponse])
def get_departments(
    _: models.User = Depends(require_permission("departments")),
    db: Session = Depends(get_db),
) -> list[DepartmentResponse]:
    return [DepartmentResponse(**item) for item in crud.list_departments(db)]


@app.post("/api/v1/admin/departments", response_model=DepartmentResponse)
def create_department(
    payload: DepartmentCreateRequest,
    current_user: models.User = Depends(require_permission("departments")),
    db: Session = Depends(get_db),
) -> DepartmentResponse:
    normalized_role = _normalize_role(current_user.role)
    if payload.initialLeaveDays is not None and normalized_role not in {"super-admin", "hr-manager"}:
        raise HTTPException(status_code=403, detail="Only Super Admin or HR Manager can define initial leave days")

    created = crud.create_department(
        db,
        {
            "name": payload.name,
            "head": payload.head,
            "lineManager": payload.lineManager,
            "hrManager": payload.hrManager,
            "staffCount": payload.staffCount,
            "initialLeaveDays": payload.initialLeaveDays,
            "approvalLevel": payload.approvalLevel,
            "status": payload.status,
            "icon": payload.icon,
            "iconBg": payload.iconBg,
            "avatarColor": payload.avatarColor,
            "updatedByUserId": current_user.id,
        },
    )
    if not created:
        raise HTTPException(status_code=409, detail="A department with this name already exists")
    return DepartmentResponse(**created)


@app.put("/api/v1/admin/departments/{department_id}", response_model=DepartmentResponse)
def update_department(
    department_id: int,
    payload: DepartmentUpdateRequest,
    current_user: models.User = Depends(require_permission("departments")),
    db: Session = Depends(get_db),
) -> DepartmentResponse:
    normalized_role = _normalize_role(current_user.role)
    if payload.initialLeaveDays is not None and normalized_role not in {"super-admin", "hr-manager"}:
        raise HTTPException(status_code=403, detail="Only Super Admin or HR Manager can define initial leave days")

    updated = crud.update_department(
        db,
        department_id,
        {
            "name": payload.name,
            "head": payload.head,
            "lineManager": payload.lineManager,
            "hrManager": payload.hrManager,
            "staffCount": payload.staffCount,
            "initialLeaveDays": payload.initialLeaveDays,
            "approvalLevel": payload.approvalLevel,
            "status": payload.status,
            "icon": payload.icon,
            "iconBg": payload.iconBg,
            "avatarColor": payload.avatarColor,
            "updatedByUserId": current_user.id,
        },
    )
    if updated is None:
        raise HTTPException(status_code=404, detail="Department not found")
    if updated == {}:
        raise HTTPException(status_code=409, detail="A department with this name already exists")
    return DepartmentResponse(**updated)


@app.delete("/api/v1/admin/departments/{department_id}")
def delete_department(
    department_id: int,
    _: models.User = Depends(require_permission("departments")),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    deleted = crud.delete_department(db, department_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Department not found")
    return {"deleted": True}


@app.get("/api/v1/admin/departments/leave-policy-audit", response_model=list[dict])
def get_department_leave_policy_audit(
    departmentId: int | None = None,
    limit: int = 200,
    _: models.User = Depends(require_permission("departments")),
    db: Session = Depends(get_db),
) -> list[dict]:
    return crud.list_department_leave_policy_audits(
        db,
        department_id=departmentId,
        limit=limit,
    )


# ---------------------------------------------------------------------------
# Performance Review Cycles
# ---------------------------------------------------------------------------

# Valid target audience values
_VALID_TARGETS = {"all_staff", "managers", "hr", "all"}


class ReviewCycleCreateRequest(BaseModel):
    title: str = Field(min_length=3)
    department: str = Field(min_length=2)
    deadline: str = Field(min_length=8, description="ISO date YYYY-MM-DD")
    targetAudience: str = "all_staff"   # all_staff | managers | hr | all
    documentFilename: str = ""
    documentData: str = ""   # base64-encoded file


class ReviewCycleResponse(BaseModel):
    id: int
    title: str
    department: str
    deadline: str
    targetAudience: str
    documentFilename: str
    status: str
    createdBy: str
    createdAt: str
    submissionCount: int


class ReviewSubmitRequest(BaseModel):
    documentFilename: str = ""
    documentData: str = ""   # base64-encoded submitted form


class ReviewAssessRequest(BaseModel):
    managerComment: str = Field(min_length=1)


class ReviewScoreRequest(BaseModel):
    hrScore: float = Field(ge=0.0, le=5.0)
    hrNotes: str = ""


class ReviewSubmissionResponse(BaseModel):
    id: int
    cycleId: int
    cycleTitle: str
    cycleDepartment: str
    cycleDeadline: str
    employeeName: str
    department: str
    documentFilename: str
    submittedAt: str
    status: str
    managerComment: str
    managerAssessedBy: str
    managerAssessedAt: str
    hrScore: float | None
    hrNotes: str
    hrScoredBy: str
    hrScoredAt: str


def _serialize_cycle(cycle: models.ReviewCycle, db: Session) -> dict:
    count = db.query(models.ReviewSubmission).filter(
        models.ReviewSubmission.cycle_id == cycle.id
    ).count()
    return {
        "id": cycle.id,
        "title": cycle.title or "",
        "department": cycle.department or "",
        "deadline": cycle.deadline or "",
        "targetAudience": cycle.target_audience or "all_staff",
        "documentFilename": cycle.document_filename or "",
        "status": cycle.status or "active",
        "createdBy": cycle.created_by or "",
        "createdAt": cycle.created_at or "",
        "submissionCount": count,
    }


def _serialize_submission(sub: models.ReviewSubmission) -> dict:
    cycle = sub.cycle
    return {
        "id": sub.id,
        "cycleId": sub.cycle_id,
        "cycleTitle": cycle.title if cycle else "",
        "cycleDepartment": cycle.department if cycle else "",
        "cycleDeadline": cycle.deadline if cycle else "",
        "employeeName": sub.employee_name or "",
        "department": sub.department or "",
        "documentFilename": sub.document_filename or "",
        "submittedAt": sub.submitted_at or "",
        "status": sub.status or "submitted",
        "managerComment": sub.manager_comment or "",
        "managerAssessedBy": sub.manager_assessed_by or "",
        "managerAssessedAt": sub.manager_assessed_at or "",
        "hrScore": sub.hr_score,
        "hrNotes": sub.hr_notes or "",
        "hrScoredBy": sub.hr_scored_by or "",
        "hrScoredAt": sub.hr_scored_at or "",
    }


def _require_reports_access(user: models.User = Depends(get_current_user)) -> models.User:
    if not _has_permission(user, "reports"):
        raise HTTPException(status_code=403, detail="Permission 'reports' is required")
    return user


def _require_hr_or_manager(user: models.User = Depends(get_current_user)) -> models.User:
    from app.crud import _normalized_role
    role = _normalized_role(user.role)
    if role not in {"super-admin", "hr-manager", "hr-officer", "department-manager", "line-manager", "dept-head", "department-head", "general-manager"}:
        raise HTTPException(status_code=403, detail="This action requires HR or manager access")
    return user


@app.post("/api/v1/hr/review-cycles", response_model=ReviewCycleResponse)
def create_review_cycle(
    payload: ReviewCycleCreateRequest,
    user: models.User = Depends(_require_reports_access),
    db: Session = Depends(get_db),
) -> ReviewCycleResponse:
    from datetime import datetime
    target = payload.targetAudience if payload.targetAudience in _VALID_TARGETS else "all_staff"
    cycle = models.ReviewCycle(
        title=payload.title,
        department=payload.department,
        deadline=payload.deadline,
        target_audience=target,
        document_filename=payload.documentFilename,
        document_data=payload.documentData,
        status="active",
        created_by=user.full_name,
        created_at=datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    )
    db.add(cycle)
    db.commit()
    db.refresh(cycle)

    # Send review cycle created email to target audience
    try:
        from app.email import send_performance_review_cycle_created_notification
        
        # Query matching active users
        query = db.query(models.User).filter(models.User.is_active == True)
        dept_filter = (cycle.department or "").strip().lower()
        if dept_filter and dept_filter not in ("all", "all departments", "general", "all staff"):
            query = query.filter(func.lower(models.User.department) == dept_filter)
        
        target_users = query.all()
        for target_u in target_users:
            # Add in-app notification
            crud.add_notification(
                db,
                user_id=target_u.id,
                title="New Review Cycle Active",
                message=f"Performance review cycle '{cycle.title}' is active. Please submit your response by {cycle.deadline}.",
                type="performance"
            )
            if target_u.email:
                send_performance_review_cycle_created_notification(
                    recipient_email=target_u.email,
                    employee_name=target_u.full_name,
                    cycle_title=cycle.title,
                    department=cycle.department or "All",
                    deadline=cycle.deadline,
                    target_audience=cycle.target_audience
                )
    except Exception as e:
        logger.error(f"Failed to send review cycle created email: {e}")

    return ReviewCycleResponse(**_serialize_cycle(cycle, db))


@app.get("/api/v1/hr/review-cycles", response_model=list[ReviewCycleResponse])
def list_review_cycles(
    user: models.User = Depends(_require_hr_or_manager),
    db: Session = Depends(get_db),
) -> list[ReviewCycleResponse]:
    from app.crud import _normalized_role
    role = _normalized_role(user.role)
    query = db.query(models.ReviewCycle)
    # Department managers see only their department's cycles
    if role in {"department-manager", "line-manager", "dept-head", "department-head", "general-manager"}:
        normalized_department = (user.department or '').strip().lower()
        if not normalized_department:
            return []
        query = query.filter(
            func.lower(models.ReviewCycle.department) == normalized_department
        )
    cycles = query.order_by(models.ReviewCycle.id.desc()).all()
    return [ReviewCycleResponse(**_serialize_cycle(c, db)) for c in cycles]


@app.get("/api/v1/hr/review-cycles/my-department", response_model=list[ReviewCycleResponse])
def get_my_department_cycles(
    user: models.User = Depends(_require_reports_access),
    db: Session = Depends(get_db),
) -> list[ReviewCycleResponse]:
    role = _normalize_role(user.role)
    hr_roles = {"super-admin", "hr-manager", "hr-officer"}
    manager_roles = {"department-manager", "line-manager", "dept-head", "department-head", "general-manager"}
    dept = (user.department or "").strip()
    if not dept:
        employee = (
            db.query(models.Employee)
            .filter(models.Employee.user_id == user.id)
            .first()
        )
        if employee and employee.department_id:
            department = (
                db.query(models.Department)
                .filter(models.Department.id == employee.department_id)
                .first()
            )
            if department and department.name:
                dept = department.name.strip()

    query = db.query(models.ReviewCycle).filter(models.ReviewCycle.status == "active")

    if role in hr_roles:
        # HR sees all cycles tagged 'hr' or 'all', regardless of department
        query = query.filter(
            models.ReviewCycle.target_audience.in_(["hr", "all"])
        )
    elif role in manager_roles:
        # Managers see cycles for their department tagged 'managers' or 'all'
        if dept:
            query = query.filter(
                func.lower(models.ReviewCycle.department) == dept.lower(),
                models.ReviewCycle.target_audience.in_(["managers", "all"]),
            )
        else:
            return []
    else:
        # Regular employees see cycles for their department tagged 'all_staff' or 'all'
        if dept:
            query = query.filter(
                func.lower(models.ReviewCycle.department) == dept.lower(),
                models.ReviewCycle.target_audience.in_(["all_staff", "all", "managers", "hr"]),
            )
        else:
            return []

    cycles = query.order_by(models.ReviewCycle.id.desc()).all()
    return [ReviewCycleResponse(**_serialize_cycle(c, db)) for c in cycles]


@app.get("/api/v1/hr/review-cycles/{cycle_id}", response_model=ReviewCycleResponse)
def get_review_cycle(
    cycle_id: int,
    _: models.User = Depends(_require_reports_access),
    db: Session = Depends(get_db),
) -> ReviewCycleResponse:
    cycle = db.query(models.ReviewCycle).filter(models.ReviewCycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Review cycle not found")
    return ReviewCycleResponse(**_serialize_cycle(cycle, db))


@app.get("/api/v1/hr/review-cycles/{cycle_id}/download")
def download_review_cycle_document(
    cycle_id: int,
    _: models.User = Depends(_require_reports_access),
    db: Session = Depends(get_db),
) -> dict:
    cycle = db.query(models.ReviewCycle).filter(models.ReviewCycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Review cycle not found")
    return {
        "documentFilename": cycle.document_filename or "",
        "documentData": cycle.document_data or "",
    }


@app.put("/api/v1/hr/review-cycles/{cycle_id}/close")
def close_review_cycle(
    cycle_id: int,
    user: models.User = Depends(_require_hr_or_manager),
    db: Session = Depends(get_db),
) -> dict:
    cycle = db.query(models.ReviewCycle).filter(models.ReviewCycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Review cycle not found")
    cycle.status = "closed"
    db.commit()
    return {"message": "Cycle closed"}


@app.delete("/api/v1/hr/review-cycles/{cycle_id}")
def delete_review_cycle(
    cycle_id: int,
    _: models.User = Depends(_require_hr_or_manager),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    cycle = db.query(models.ReviewCycle).filter(models.ReviewCycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Review cycle not found")
    db.delete(cycle)
    db.commit()
    return {"deleted": True}


# ---------------------------------------------------------------------------
# Submissions
# ---------------------------------------------------------------------------

@app.post("/api/v1/hr/review-cycles/{cycle_id}/submit", response_model=ReviewSubmissionResponse)
def submit_review(
    cycle_id: int,
    payload: ReviewSubmitRequest,
    user: models.User = Depends(_require_reports_access),
    db: Session = Depends(get_db),
) -> ReviewSubmissionResponse:
    from datetime import datetime
    cycle = db.query(models.ReviewCycle).filter(models.ReviewCycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Review cycle not found")
    if cycle.status != "active":
        raise HTTPException(status_code=400, detail="This review cycle is no longer accepting submissions")

    existing = db.query(models.ReviewSubmission).filter(
        models.ReviewSubmission.cycle_id == cycle_id,
        models.ReviewSubmission.employee_user_id == user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="You have already submitted for this review cycle")

    sub = models.ReviewSubmission(
        cycle_id=cycle_id,
        employee_user_id=user.id,
        employee_name=user.full_name,
        department=user.department or "",
        document_filename=payload.documentFilename,
        document_data=payload.documentData,
        submitted_at=datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        status="submitted",
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)

    # Send performance review submission email
    try:
        from app.email import send_performance_review_submitted_notification
        
        manager_emails = []
        
        # 1. Try resolving via employee reporting hierarchy
        from app.crud import _find_active_user_by_full_name
        employee = db.query(models.Employee).filter(models.Employee.user_id == user.id).first()
        if employee and employee.reporting:
            for rep_item in employee.reporting:
                cleaned_name = rep_item.split("(")[0].strip()
                mgr_user = _find_active_user_by_full_name(db, cleaned_name)
                if mgr_user and mgr_user.email:
                    manager_emails.append(mgr_user.email)
        
        # 2. Try resolving via department manager/head
        if not manager_emails and employee and employee.department_id:
            dept = db.query(models.Department).filter(models.Department.id == employee.department_id).first()
            if dept:
                for name in (dept.line_manager, dept.head, dept.hr_manager):
                    if name:
                        mgr_user = _find_active_user_by_full_name(db, name)
                        if mgr_user and mgr_user.email:
                            manager_emails.append(mgr_user.email)
        
        # 3. Fallback to HR users if no manager is found
        if not manager_emails:
            hr_users = db.query(models.User).filter(models.User.role.in_(["hr-manager", "hr-officer", "super-admin"])).all()
            manager_emails = [hr_u.email for hr_u in hr_users if hr_u.email]

        # Add employee confirmation notification
        crud.add_notification(
            db,
            user_id=user.id,
            title="Review Response Submitted",
            message=f"Your performance review response for '{cycle.title}' has been submitted.",
            type="performance"
        )
        
        # Add notifications for resolved managers
        for mgr_email in set(manager_emails):
            mgr_user = db.query(models.User).filter(models.User.email == mgr_email).first()
            if mgr_user and mgr_user.id != user.id:
                crud.add_notification(
                    db,
                    user_id=mgr_user.id,
                    title="Review Response Received",
                    message=f"{user.full_name} submitted their response for '{cycle.title}'.",
                    type="performance"
                )

        # Send email to resolved managers
        for mgr_email in set(manager_emails):
            if mgr_email != user.email:
                send_performance_review_submitted_notification(
                    recipient_email=mgr_email,
                    employee_name=user.full_name,
                    cycle_title=cycle.title,
                    document_filename=payload.documentFilename
                )
    except Exception as e:
        logger.error(f"Failed to send performance review submission email: {e}")

    return ReviewSubmissionResponse(**_serialize_submission(sub))


@app.get("/api/v1/hr/review-cycles/{cycle_id}/submissions", response_model=list[ReviewSubmissionResponse])
def list_cycle_submissions(
    cycle_id: int,
    user: models.User = Depends(_require_hr_or_manager),
    db: Session = Depends(get_db),
) -> list[ReviewSubmissionResponse]:
    from app.crud import _normalized_role
    role = _normalized_role(user.role)
    query = db.query(models.ReviewSubmission).filter(
        models.ReviewSubmission.cycle_id == cycle_id
    )
    # Dept managers only see their department's submissions
    if role in {"department-manager", "line-manager", "dept-head", "department-head", "general-manager"}:
        normalized_department = (user.department or '').strip().lower()
        if not normalized_department:
            return []
        query = query.filter(
            func.lower(models.ReviewSubmission.department) == normalized_department
        )
    subs = query.order_by(models.ReviewSubmission.id.asc()).all()
    return [ReviewSubmissionResponse(**_serialize_submission(s)) for s in subs]


@app.get("/api/v1/hr/review-cycles/{cycle_id}/submissions/my", response_model=ReviewSubmissionResponse | None)
def get_my_submission(
    cycle_id: int,
    user: models.User = Depends(_require_reports_access),
    db: Session = Depends(get_db),
) -> ReviewSubmissionResponse | None:
    sub = db.query(models.ReviewSubmission).filter(
        models.ReviewSubmission.cycle_id == cycle_id,
        models.ReviewSubmission.employee_user_id == user.id,
    ).first()
    if not sub:
        return None
    return ReviewSubmissionResponse(**_serialize_submission(sub))


@app.put("/api/v1/hr/review-submissions/{sub_id}/assess", response_model=ReviewSubmissionResponse)
def assess_submission(
    sub_id: int,
    payload: ReviewAssessRequest,
    user: models.User = Depends(_require_hr_or_manager),
    db: Session = Depends(get_db),
) -> ReviewSubmissionResponse:
    from datetime import datetime
    sub = db.query(models.ReviewSubmission).filter(models.ReviewSubmission.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    sub.manager_comment = payload.managerComment
    sub.manager_assessed_by = user.full_name
    sub.manager_assessed_at = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    sub.status = "assessed"
    db.commit()
    db.refresh(sub)

    # Send manager assessment notification to the employee
    try:
        employee_user = db.query(models.User).filter(models.User.id == sub.employee_user_id).first()
        if employee_user:
            crud.add_notification(
                db,
                user_id=employee_user.id,
                title="Performance Review Assessed",
                message=f"Your performance review response for '{sub.cycle.title if sub.cycle else 'Cycle'}' has been assessed by your manager {user.full_name}.",
                type="performance"
            )
        if employee_user and employee_user.email:
            from app.email import send_performance_review_assessed_notification
            send_performance_review_assessed_notification(
                recipient_email=employee_user.email,
                employee_name=sub.employee_name,
                cycle_title=sub.cycle.title if sub.cycle else "Performance Review",
                manager_name=user.full_name,
                manager_comment=payload.managerComment
            )
    except Exception as e:
        logger.error(f"Failed to send review assessed email: {e}")

    return ReviewSubmissionResponse(**_serialize_submission(sub))


@app.put("/api/v1/hr/review-submissions/{sub_id}/score", response_model=ReviewSubmissionResponse)
def score_submission(
    sub_id: int,
    payload: ReviewScoreRequest,
    user: models.User = Depends(_require_reports_access),
    db: Session = Depends(get_db),
) -> ReviewSubmissionResponse:
    from datetime import datetime
    sub = db.query(models.ReviewSubmission).filter(models.ReviewSubmission.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    sub.hr_score = payload.hrScore
    sub.hr_notes = payload.hrNotes
    sub.hr_scored_by = user.full_name
    sub.hr_scored_at = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    sub.status = "scored"
    db.commit()
    db.refresh(sub)

    # Send HR score notification to the employee
    try:
        employee_user = db.query(models.User).filter(models.User.id == sub.employee_user_id).first()
        if employee_user:
            crud.add_notification(
                db,
                user_id=employee_user.id,
                title="Performance Review Scored",
                message=f"Your performance review for '{sub.cycle.title if sub.cycle else 'Cycle'}' has been scored: {payload.hrScore} / 5.0.",
                type="performance"
            )
        if employee_user and employee_user.email:
            from app.email import send_performance_review_scored_notification
            send_performance_review_scored_notification(
                recipient_email=employee_user.email,
                employee_name=sub.employee_name,
                cycle_title=sub.cycle.title if sub.cycle else "Performance Review",
                hr_name=user.full_name,
                hr_score=payload.hrScore,
                hr_notes=payload.hrNotes
            )
    except Exception as e:
        logger.error(f"Failed to send review scored email: {e}")

    return ReviewSubmissionResponse(**_serialize_submission(sub))


@app.get("/api/v1/hr/review-submissions/my", response_model=list[ReviewSubmissionResponse])
def get_my_submissions(
    user: models.User = Depends(_require_reports_access),
    db: Session = Depends(get_db),
) -> list[ReviewSubmissionResponse]:
    subs = (
        db.query(models.ReviewSubmission)
        .filter(models.ReviewSubmission.employee_user_id == user.id)
        .order_by(models.ReviewSubmission.id.desc())
        .all()
    )
    return [ReviewSubmissionResponse(**_serialize_submission(s)) for s in subs]


# ---------------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------------

@app.get("/api/v1/notifications", response_model=list[dict])
def get_my_notifications(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict]:
    return crud.list_notifications(db, current_user.id)


@app.put("/api/v1/notifications/{notification_id}/read", response_model=dict)
def mark_notification_read(
    notification_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    success = crud.mark_notification_as_read(db, notification_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}


@app.put("/api/v1/notifications/read-all", response_model=dict)
def mark_all_notifications_read(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    crud.mark_all_notifications_as_read(db, current_user.id)
    return {"message": "All notifications marked as read"}

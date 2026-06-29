"""expand employee biodata fields

Revision ID: 20260326_0005
Revises: 20260324_0004
Create Date: 2026-03-26 12:00:00
"""

from alembic import op
import sqlalchemy as sa

revision = "20260326_0005"
down_revision = "20260324_0004"
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
    with op.batch_alter_table("employees") as batch:
        for col_name in [
            "first_name",
            "last_name",
            "gender",
            "date_of_birth",
            "nationality",
            "marital_status",
            "profile_photo",
            "national_id",
            "personal_email",
            "work_email",
            "emergency_contact_name",
            "emergency_contact_phone",
            "emergency_contact_relationship",
            "address_city",
            "address_district",
            "address_country",
            "address_line1",
            "employee_code",
            "employment_type",
            "date_of_joining",
            "work_location",
            "salary",
            "pay_grade",
            "bank_details",
            "tax_id",
            "nssf_number",
            "cv_document",
            "contract_document",
            "id_copy_document",
            "certificates_document",
            "other_documents",
        ]:
            if col_name not in employee_columns:
                batch.add_column(sa.Column(col_name, sa.String(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("employees"):
        return

    employee_columns = _get_columns(inspector, "employees")
    with op.batch_alter_table("employees") as batch:
        for col_name in [
            "first_name",
            "last_name",
            "gender",
            "date_of_birth",
            "nationality",
            "marital_status",
            "profile_photo",
            "national_id",
            "personal_email",
            "work_email",
            "emergency_contact_name",
            "emergency_contact_phone",
            "emergency_contact_relationship",
            "address_city",
            "address_district",
            "address_country",
            "address_line1",
            "employee_code",
            "employment_type",
            "date_of_joining",
            "work_location",
            "salary",
            "pay_grade",
            "bank_details",
            "tax_id",
            "nssf_number",
            "cv_document",
            "contract_document",
            "id_copy_document",
            "certificates_document",
            "other_documents",
        ]:
            if col_name in employee_columns:
                batch.drop_column(col_name)

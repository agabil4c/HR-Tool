"""add review_cycles and review_submissions tables

Revision ID: 20260407_0006
Revises: 20260326_0005
Create Date: 2026-04-07 09:00:00
"""

from alembic import op
import sqlalchemy as sa

revision = "20260407_0006"
down_revision = "20260326_0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("review_cycles"):
        op.create_table(
            "review_cycles",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("title", sa.String(), nullable=False),
            sa.Column("department", sa.String(), nullable=False),
            sa.Column("deadline", sa.String(), nullable=True),
            sa.Column("document_filename", sa.String(), nullable=True),
            sa.Column("document_data", sa.Text(), nullable=True),
            sa.Column("status", sa.String(), nullable=True, server_default="active"),
            sa.Column("created_by", sa.String(), nullable=True),
            sa.Column("created_at", sa.String(), nullable=True),
        )
        op.create_index("ix_review_cycles_id", "review_cycles", ["id"], unique=False)

    if not inspector.has_table("review_submissions"):
        op.create_table(
            "review_submissions",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("cycle_id", sa.Integer(), sa.ForeignKey("review_cycles.id"), nullable=False),
            sa.Column("employee_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
            sa.Column("employee_name", sa.String(), nullable=False),
            sa.Column("department", sa.String(), nullable=True),
            sa.Column("document_filename", sa.String(), nullable=True),
            sa.Column("document_data", sa.Text(), nullable=True),
            sa.Column("submitted_at", sa.String(), nullable=True),
            sa.Column("status", sa.String(), nullable=True, server_default="submitted"),
            sa.Column("manager_comment", sa.String(), nullable=True),
            sa.Column("manager_assessed_by", sa.String(), nullable=True),
            sa.Column("manager_assessed_at", sa.String(), nullable=True),
            sa.Column("hr_score", sa.Float(), nullable=True),
            sa.Column("hr_notes", sa.String(), nullable=True),
            sa.Column("hr_scored_by", sa.String(), nullable=True),
            sa.Column("hr_scored_at", sa.String(), nullable=True),
        )
        op.create_index("ix_review_submissions_id", "review_submissions", ["id"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if inspector.has_table("review_submissions"):
        op.drop_index("ix_review_submissions_id", table_name="review_submissions")
        op.drop_table("review_submissions")

    if inspector.has_table("review_cycles"):
        op.drop_index("ix_review_cycles_id", table_name="review_cycles")
        op.drop_table("review_cycles")

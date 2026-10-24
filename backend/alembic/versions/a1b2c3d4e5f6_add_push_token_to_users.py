"""Add push_token to users

Revision ID: a1b2c3d4e5f6
Revises: 9b2e52d7e29b
Create Date: 2026-10-24 03:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "9b2e52d7e29b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("push_token", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "push_token")

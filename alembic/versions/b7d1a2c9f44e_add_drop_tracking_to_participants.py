"""add drop tracking to participants

Revision ID: b7d1a2c9f44e
Revises: 34aeb7b524ce
Create Date: 2026-04-19 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7d1a2c9f44e'
down_revision: Union[str, Sequence[str], None] = '34aeb7b524ce'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "participants",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column("participants", sa.Column("dropped_round", sa.Integer(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("participants", "dropped_round")
    op.drop_column("participants", "is_active")

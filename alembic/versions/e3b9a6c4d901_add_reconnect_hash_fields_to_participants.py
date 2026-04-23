"""add reconnect hash fields to participants

Revision ID: e3b9a6c4d901
Revises: 34aeb7b524ce
Create Date: 2026-04-22 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "e3b9a6c4d901"
down_revision: Union[str, Sequence[str], None] = "b7d1a2c9f44e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "participants",
        sa.Column("reconnect_code_hash", sa.String(), nullable=True),
    )
    op.add_column(
        "participants",
        sa.Column(
            "reconnect_required",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )
    op.create_index(
        "ix_participants_reconnect_code_hash",
        "participants",
        ["reconnect_code_hash"],
        unique=True,
    )

    op.execute(
        "UPDATE participants SET reconnect_required = TRUE WHERE reconnect_code_hash IS NULL"
    )

    op.alter_column("participants", "reconnect_required", server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_participants_reconnect_code_hash", table_name="participants")
    op.drop_column("participants", "reconnect_required")
    op.drop_column("participants", "reconnect_code_hash")

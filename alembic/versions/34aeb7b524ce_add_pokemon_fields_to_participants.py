"""add pokemon fields to participants

Revision ID: 34aeb7b524ce
Revises: 22fc4735b24d
Create Date: 2026-03-07 12:56:14.162733

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "34aeb7b524ce"
down_revision: Union[str, Sequence[str], None] = "22fc4735b24d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("participants", sa.Column("pokemon_1", sa.String(), nullable=True))
    op.add_column("participants", sa.Column("pokemon_2", sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("participants", "pokemon_2")
    op.drop_column("participants", "pokemon_1")

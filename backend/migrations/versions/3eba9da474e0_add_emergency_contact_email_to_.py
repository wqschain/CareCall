"""add emergency contact email to recipients

Revision ID: 3eba9da474e0
Revises: 3f0218b46143
Create Date: 2025-06-28 09:26:43.588624

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3eba9da474e0'
down_revision: Union[str, None] = '3f0218b46143'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('recipients', sa.Column('emergency_contact_email', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('recipients', 'emergency_contact_email')

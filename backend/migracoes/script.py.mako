"""${message}

Revisão: ${up_revision}
Revisão anterior: ${down_revision | comma,n}
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
${imports if imports else ""}

revisao: str = ${repr(up_revision)}
revisao_anterior: Union[str, Sequence[str], None] = ${repr(down_revision)}
rotulos: Union[str, Sequence[str], None] = ${repr(branch_labels)}
depende_de: Union[str, Sequence[str], None] = ${repr(depends_on)}


def upgrade() -> None:
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    ${downgrades if downgrades else "pass"}


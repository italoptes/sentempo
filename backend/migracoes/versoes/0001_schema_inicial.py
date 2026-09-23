"""Cria participantes e tentativas."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "0001_schema_inicial"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "participantes",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("nome", sa.String(length=120), nullable=False),
        sa.Column("nome_normalizado", sa.String(length=120), nullable=False),
        sa.Column("codigo", sa.String(length=4), nullable=False),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("atualizado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("codigo ~ '^[0-9]{4}$'", name="ck_participante_codigo"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("nome_normalizado", "codigo", name="uq_participante_nome_codigo"),
    )
    op.create_index("ix_participantes_nome_codigo", "participantes", ["nome_normalizado", "codigo"])
    op.create_index("ix_participantes_criado_em", "participantes", ["criado_em"])
    op.create_table(
        "tentativas",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("participante_id", sa.Uuid(), nullable=False),
        sa.Column("tempo_alvo_ms", sa.Integer(), nullable=False),
        sa.Column(
            "condicao",
            sa.Enum("SEM_ESTIMULO", "RAPIDO", "LENTO", name="condicao_tentativa", native_enum=False),
            nullable=False,
        ),
        sa.Column("resultado_ms", sa.Numeric(12, 3), nullable=False),
        sa.Column("erro_ms", sa.Numeric(12, 3), nullable=False),
        sa.Column("erro_absoluto_ms", sa.Numeric(12, 3), nullable=False),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("tempo_alvo_ms IN (5000, 15000, 30000)", name="ck_tempo_alvo"),
        sa.CheckConstraint("resultado_ms > 0", name="ck_resultado_positivo"),
        sa.CheckConstraint("erro_absoluto_ms >= 0", name="ck_erro_absoluto"),
        sa.ForeignKeyConstraint(["participante_id"], ["participantes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "participante_id", "tempo_alvo_ms", "condicao", name="uq_tentativa_participante_combinacao"
        ),
    )
    op.create_index("ix_tentativas_participante_id", "tentativas", ["participante_id"])
    op.create_index("ix_tentativas_condicao_tempo", "tentativas", ["condicao", "tempo_alvo_ms"])
    op.create_index("ix_tentativas_criado_em", "tentativas", ["criado_em"])


def downgrade() -> None:
    op.drop_table("tentativas")
    op.drop_table("participantes")


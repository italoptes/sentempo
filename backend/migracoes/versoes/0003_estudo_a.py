"""Cria sessões do Estudo A sem modificar resultados históricos."""
from alembic import op
import sqlalchemy as sa

revision = "0003_estudo_a"
down_revision = "40ae90ed5e83"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("distribuicoes_protocolos",
        sa.Column("versao", sa.String(40), primary_key=True),
        sa.Column("proxima", sa.Integer(), nullable=False))
    op.bulk_insert(sa.table("distribuicoes_protocolos", sa.column("versao", sa.String), sa.column("proxima", sa.Integer)),
                   [{"versao": "ESTUDO_A_V1", "proxima": 0}])
    op.create_table("sessoes_estudo",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("participante_id", sa.Uuid(), sa.ForeignKey("participantes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("versao_protocolo", sa.String(40), nullable=False),
        sa.Column("sequencia", sa.Integer(), nullable=False),
        sa.Column("bloco_liberado", sa.Integer(), nullable=False),
        sa.Column("dispositivo", sa.String(20), nullable=False),
        sa.Column("usa_fones", sa.Boolean(), nullable=False),
        sa.Column("volume", sa.Numeric(3, 2), nullable=False),
        sa.Column("consentido_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("concluida_em", sa.DateTime(timezone=True)),
        sa.UniqueConstraint("participante_id", "versao_protocolo", name="uq_sessao_participante_versao"),
        sa.CheckConstraint("sequencia >= 0 AND sequencia < 6", name="ck_sessao_sequencia"),
        sa.CheckConstraint("bloco_liberado BETWEEN 1 AND 3", name="ck_sessao_bloco"),
        sa.CheckConstraint("volume BETWEEN 0.1 AND 1", name="ck_sessao_volume"),
        sa.CheckConstraint("dispositivo IN ('COMPUTADOR', 'CELULAR', 'TABLET', 'OUTRO')", name="ck_sessao_dispositivo"))
    op.create_index("ix_sessoes_estudo_participante_id", "sessoes_estudo", ["participante_id"])
    op.create_table("tentativas_estudo",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("sessao_id", sa.Uuid(), sa.ForeignKey("sessoes_estudo.id", ondelete="CASCADE"), nullable=False),
        sa.Column("ordem", sa.Integer(), nullable=False),
        sa.Column("bloco", sa.Integer(), nullable=False),
        sa.Column("repeticao", sa.Integer(), nullable=False),
        sa.Column("condicao", sa.String(20), nullable=False),
        sa.Column("tempo_alvo_ms", sa.Integer(), nullable=False),
        sa.Column("resultado_ms", sa.Numeric(18, 3)),
        sa.Column("erro_ms", sa.Numeric(18, 3)),
        sa.Column("erro_absoluto_ms", sa.Numeric(18, 3)),
        sa.Column("erro_relativo_percentual", sa.Numeric(20, 6)),
        sa.Column("concluida_em", sa.DateTime(timezone=True)),
        sa.UniqueConstraint("sessao_id", "ordem", name="uq_estudo_sessao_ordem"),
        sa.UniqueConstraint("sessao_id", "condicao", "tempo_alvo_ms", "repeticao", name="uq_estudo_repeticao"),
        sa.CheckConstraint("ordem BETWEEN 1 AND 27 AND bloco BETWEEN 1 AND 3 AND repeticao BETWEEN 1 AND 3", name="ck_estudo_posicao"),
        sa.CheckConstraint("bloco = 1 + (ordem - 1) / 9", name="ck_estudo_bloco_ordem"),
        sa.CheckConstraint("tempo_alvo_ms IN (5000, 10000, 15000)", name="ck_estudo_tempo"),
        sa.CheckConstraint("condicao IN ('SEM_ESTIMULO', 'LENTO', 'RAPIDO')", name="ck_estudo_condicao"),
        sa.CheckConstraint(
            "(resultado_ms IS NULL AND erro_ms IS NULL AND erro_absoluto_ms IS NULL AND erro_relativo_percentual IS NULL AND concluida_em IS NULL) OR "
            "(resultado_ms IS NOT NULL AND resultado_ms > 0 AND erro_ms IS NOT NULL AND erro_ms = round(resultado_ms - tempo_alvo_ms, 3) "
            "AND erro_absoluto_ms IS NOT NULL AND erro_absoluto_ms = abs(erro_ms) AND erro_relativo_percentual IS NOT NULL AND concluida_em IS NOT NULL)",
            name="ck_estudo_resultado_completo"))
    op.create_index("ix_tentativas_estudo_sessao_id", "tentativas_estudo", ["sessao_id"])


def downgrade() -> None:
    # Downgrade destrói dados da nova coleta; nunca executado automaticamente.
    op.drop_table("tentativas_estudo")
    op.drop_table("sessoes_estudo")
    op.drop_table("distribuicoes_protocolos")

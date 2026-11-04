"""Questionário aprovado; respostas opcionais com marco de preenchimento."""
from alembic import op
import sqlalchemy as sa

revision = "0004_questionario_estudo"
down_revision = "0003_estudo_a"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("tentativas_estudo", sa.Column("confianca", sa.Integer()))
    op.add_column("tentativas_estudo", sa.Column("respondida_em", sa.DateTime(timezone=True)))
    op.create_check_constraint("ck_estudo_confianca", "tentativas_estudo", "confianca IS NULL OR confianca BETWEEN 1 AND 7")
    op.add_column("sessoes_estudo", sa.Column("estrategia", sa.String(30)))
    op.add_column("sessoes_estudo", sa.Column("comentario", sa.String(300)))
    op.create_table("respostas_blocos_estudo",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("sessao_id", sa.Uuid(), sa.ForeignKey("sessoes_estudo.id", ondelete="CASCADE"), nullable=False),
        sa.Column("bloco", sa.Integer(), nullable=False),
        sa.Column("agradabilidade", sa.Integer()),
        sa.Column("ansiedade", sa.Integer()),
        sa.Column("respondida_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("sessao_id", "bloco", name="uq_resposta_bloco_estudo"),
        sa.CheckConstraint("bloco BETWEEN 1 AND 3", name="ck_resposta_bloco_posicao"),
        sa.CheckConstraint("agradabilidade IS NULL OR agradabilidade BETWEEN 1 AND 7", name="ck_resposta_agradabilidade"),
        sa.CheckConstraint("ansiedade IS NULL OR ansiedade BETWEEN 1 AND 7", name="ck_resposta_ansiedade"))


def downgrade():
    op.drop_table("respostas_blocos_estudo")
    op.drop_column("sessoes_estudo", "comentario")
    op.drop_column("sessoes_estudo", "estrategia")
    op.drop_constraint("ck_estudo_confianca", "tentativas_estudo", type_="check")
    op.drop_column("tentativas_estudo", "respondida_em")
    op.drop_column("tentativas_estudo", "confianca")

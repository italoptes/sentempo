"""Permite blocos de três tentativas, preservando o plano de 27 da versão V1."""
from alembic import op
import sqlalchemy as sa

revision = "0005_estudo_a_nove"
down_revision = "0004_questionario_estudo"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Todas as posições preexistentes pertencem ao desenho de nove por bloco.
    op.add_column("tentativas_estudo", sa.Column("tamanho_bloco", sa.Integer(), server_default="9", nullable=False))
    op.alter_column("tentativas_estudo", "tamanho_bloco", server_default="3")
    op.drop_constraint("ck_estudo_posicao", "tentativas_estudo", type_="check")
    op.drop_constraint("ck_estudo_bloco_ordem", "tentativas_estudo", type_="check")
    op.create_check_constraint("ck_estudo_tamanho_bloco", "tentativas_estudo", "tamanho_bloco IN (3, 9)")
    op.create_check_constraint("ck_estudo_posicao", "tentativas_estudo",
        "ordem BETWEEN 1 AND 3 * tamanho_bloco AND bloco BETWEEN 1 AND 3 AND repeticao BETWEEN 1 AND tamanho_bloco / 3")
    op.create_check_constraint("ck_estudo_bloco_ordem", "tentativas_estudo", "bloco = 1 + (ordem - 1) / tamanho_bloco")
    op.bulk_insert(sa.table("distribuicoes_protocolos", sa.column("versao", sa.String), sa.column("proxima", sa.Integer)),
                  [{"versao": "ESTUDO_A_V2", "proxima": 0}])


def downgrade() -> None:
    # Não converter silenciosamente uma coleta V2 em um plano V1 incompatível.
    if op.get_bind().scalar(sa.text("SELECT count(*) FROM sessoes_estudo WHERE versao_protocolo = 'ESTUDO_A_V2'")):
        raise RuntimeError("Downgrade incompatível com sessões ESTUDO_A_V2 existentes; preserve os dados e mantenha a migração.")
    op.drop_constraint("ck_estudo_tamanho_bloco", "tentativas_estudo", type_="check")
    op.drop_constraint("ck_estudo_posicao", "tentativas_estudo", type_="check")
    op.drop_constraint("ck_estudo_bloco_ordem", "tentativas_estudo", type_="check")
    op.create_check_constraint("ck_estudo_posicao", "tentativas_estudo", "ordem BETWEEN 1 AND 27 AND bloco BETWEEN 1 AND 3 AND repeticao BETWEEN 1 AND 3")
    op.create_check_constraint("ck_estudo_bloco_ordem", "tentativas_estudo", "bloco = 1 + (ordem - 1) / 9")
    op.drop_column("tentativas_estudo", "tamanho_bloco")
    op.execute(sa.text("DELETE FROM distribuicoes_protocolos WHERE versao = 'ESTUDO_A_V2'"))

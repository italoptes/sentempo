import uuid

from sqlalchemy import select, delete
from sqlalchemy.orm import Session

from app.entidades.tentativa import Condicao, Tentativa


class RepositorioTentativas:
    def __init__(self, sessao: Session):
        self.sessao = sessao

    def buscar_combinacao(
        self, participante_id: uuid.UUID, tempo_alvo_ms: int, condicao: Condicao
    ) -> Tentativa | None:
        from app.entidades.tentativa import TipoTentativa
        consulta = select(Tentativa).where(
            Tentativa.participante_id == participante_id,
            Tentativa.tempo_alvo_ms == tempo_alvo_ms,
            Tentativa.condicao == condicao,
            Tentativa.tipo_tentativa == TipoTentativa.OFICIAL,
        )
        return self.sessao.scalar(consulta)

    def criar(self, tentativa: Tentativa) -> Tentativa:
        self.sessao.add(tentativa)
        self.sessao.flush()
        return tentativa

    def listar_todas(self) -> list[Tentativa]:
        consulta = select(Tentativa).order_by(Tentativa.criado_em.asc())
        return list(self.sessao.scalars(consulta).all())

    def excluir_por_participante(self, participante_id: uuid.UUID) -> None:
        comando = delete(Tentativa).where(Tentativa.participante_id == participante_id)
        self.sessao.execute(comando)
        self.sessao.flush()

    def excluir_uma(self, tentativa_id: uuid.UUID) -> int:
        comando = delete(Tentativa).where(Tentativa.id == tentativa_id)
        resultado = self.sessao.execute(comando)
        self.sessao.flush()
        return resultado.rowcount


import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.entidades.tempo_personalizado import TempoPersonalizado


class RepositorioTemposPersonalizados:
    def __init__(self, sessao: Session):
        self.sessao = sessao

    def listar_ativos(self, participante_id: uuid.UUID) -> list[TempoPersonalizado]:
        consulta = select(TempoPersonalizado).where(
            TempoPersonalizado.participante_id == participante_id,
            TempoPersonalizado.ativo == True,
        ).order_by(TempoPersonalizado.tempo_alvo_ms.asc())
        return list(self.sessao.scalars(consulta).all())

    def buscar_por_id_e_participante(
        self, id: uuid.UUID, participante_id: uuid.UUID
    ) -> TempoPersonalizado | None:
        consulta = select(TempoPersonalizado).where(
            TempoPersonalizado.id == id,
            TempoPersonalizado.participante_id == participante_id,
            TempoPersonalizado.ativo == True,
        )
        return self.sessao.scalar(consulta)
        
    def buscar_por_tempo_e_participante(
        self, tempo_alvo_ms: int, participante_id: uuid.UUID
    ) -> TempoPersonalizado | None:
        consulta = select(TempoPersonalizado).where(
            TempoPersonalizado.tempo_alvo_ms == tempo_alvo_ms,
            TempoPersonalizado.participante_id == participante_id,
            TempoPersonalizado.ativo == True,
        )
        return self.sessao.scalar(consulta)

    def criar(self, tempo: TempoPersonalizado) -> TempoPersonalizado:
        self.sessao.add(tempo)
        self.sessao.flush()
        return tempo

    def inativar(self, tempo: TempoPersonalizado) -> None:
        tempo.ativo = False
        self.sessao.flush()

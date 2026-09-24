import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TempoPersonalizadoCriacao(BaseModel):
    tempo_alvo_ms: int = Field(..., gt=0, le=120000, description="Tempo alvo em milissegundos")


class TempoPersonalizadoResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tempo_alvo_ms: int
    ativo: bool
    criado_em: datetime


class ModoLivreStatus(BaseModel):
    desbloqueado: bool
    tempos: list[TempoPersonalizadoResposta]

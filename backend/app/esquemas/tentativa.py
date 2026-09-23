import math
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.entidades.tentativa import Condicao


TEMPOS_PERMITIDOS = {5000, 15000, 30000}


class TentativaCriacao(BaseModel):
    tempo_alvo_ms: int
    condicao: Condicao
    resultado_ms: float

    @field_validator("tempo_alvo_ms")
    @classmethod
    def validar_tempo(cls, valor: int) -> int:
        if valor not in TEMPOS_PERMITIDOS:
            raise ValueError("tempo_alvo_ms deve ser 5000, 15000 ou 30000")
        return valor

    @field_validator("resultado_ms")
    @classmethod
    def validar_resultado(cls, valor: float) -> float:
        if not math.isfinite(valor) or valor <= 0:
            raise ValueError("resultado_ms deve ser finito e maior que zero")
        return valor


class TentativaResposta(BaseModel):
    id: uuid.UUID
    participante_id: uuid.UUID | None = None
    tempo_alvo_ms: int
    condicao: Condicao
    resultado_ms: float
    erro_ms: float
    erro_absoluto_ms: float
    criado_em: datetime

    model_config = ConfigDict(from_attributes=True)


class CombinacaoResposta(BaseModel):
    tempo_alvo_ms: int
    condicao: Condicao
    concluida: bool


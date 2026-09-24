import math
import uuid
from datetime import datetime

from typing import Any
from pydantic import BaseModel, ConfigDict, field_validator, model_validator

from app.entidades.tentativa import Condicao, TipoTentativa


TEMPOS_PERMITIDOS = {5000, 15000, 30000}


class TentativaCriacao(BaseModel):
    tempo_alvo_ms: int
    condicao: Condicao
    resultado_ms: float
    tipo_tentativa: TipoTentativa = TipoTentativa.OFICIAL
    tempo_personalizado_id: uuid.UUID | None = None

    @model_validator(mode="after")
    def validar_tempo_por_tipo(self) -> "TentativaCriacao":
        if self.tipo_tentativa == TipoTentativa.OFICIAL:
            if self.tempo_alvo_ms not in TEMPOS_PERMITIDOS:
                raise ValueError("Para tentativa oficial, tempo_alvo_ms deve ser 5000, 15000 ou 30000")
        else:
            if self.tempo_alvo_ms <= 0:
                raise ValueError("Para tentativa personalizada, tempo_alvo_ms deve ser maior que zero")
            if not self.tempo_personalizado_id:
                raise ValueError("Para tentativa personalizada, tempo_personalizado_id é obrigatório")
        return self

    @field_validator("resultado_ms")
    @classmethod
    def validar_resultado(cls, valor: float) -> float:
        if not math.isfinite(valor) or valor <= 0:
            raise ValueError("resultado_ms deve ser finito e maior que zero")
        return valor


class TentativaResposta(BaseModel):
    id: uuid.UUID
    participante_id: uuid.UUID | None = None
    tempo_personalizado_id: uuid.UUID | None = None
    tipo_tentativa: TipoTentativa
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


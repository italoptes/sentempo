import uuid
from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class SessaoCriacao(BaseModel):
    model_config = ConfigDict(extra="forbid")
    consentimento: Literal[True]
    audio_testado: Literal[True]
    dispositivo: Literal["COMPUTADOR", "CELULAR", "TABLET", "OUTRO"]
    usa_fones: bool
    volume: Decimal = Field(ge=Decimal("0.1"), le=1, decimal_places=2)


class ResultadoEstudo(BaseModel):
    model_config = ConfigDict(extra="forbid")
    resultado_ms: Decimal = Field(gt=0, lt=Decimal("1000000000000000"), allow_inf_nan=False)


class PosicaoResposta(BaseModel):
    id: uuid.UUID
    ordem: int
    bloco: int
    repeticao: int
    condicao: str
    tempo_alvo_ms: int
    concluida: bool
    confianca: int | None = None
    questionario_respondido: bool = False
    resultado_ms: float | None = None
    erro_ms: float | None = None
    erro_absoluto_ms: float | None = None
    erro_relativo_percentual: float | None = None


class BlocoResposta(BaseModel):
    posicao: int
    condicao: str
    concluidas: int
    total: int = 9


class SessaoResposta(BaseModel):
    id: uuid.UUID
    versao_protocolo: str
    sequencia: int
    ordem_condicoes: list[str]
    dispositivo: str
    usa_fones: bool
    volume: float
    consentido_em: datetime
    concluida_em: datetime | None
    bloco_liberado: int
    concluidas: int
    total: int = 27
    situacao: Literal["EM_ANDAMENTO", "INTERVALO", "CONCLUIDA", "QUESTIONARIO_TENTATIVA", "QUESTIONARIO_BLOCO", "QUESTIONARIO_FINAL"]
    proxima: PosicaoResposta | None
    blocos: list[BlocoResposta]
    tentativas: list[PosicaoResposta]
    questionario_pendente: dict | None = None
    respostas_blocos: list[dict] = []
    estrategia: str | None = None
    comentario: str | None = None


class RespostaQuestionario(BaseModel):
    model_config = ConfigDict(extra="forbid")
    tipo: Literal["TENTATIVA", "BLOCO", "FINAL"]
    tentativa_id: uuid.UUID | None = None
    bloco: int | None = Field(default=None, ge=1, le=3)
    confianca: int | None = Field(default=None, ge=1, le=7, strict=True)
    agradabilidade: int | None = Field(default=None, ge=1, le=7, strict=True)
    ansiedade: int | None = Field(default=None, ge=1, le=7, strict=True)
    estrategia: Literal["SEM_CONTAGEM", "CONTAGEM_MENTAL", "CONTAGEM_BIPES", "COMBINADA", "OUTRA"] | None = None
    comentario: str | None = Field(default=None, max_length=300)

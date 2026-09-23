import uuid
from datetime import datetime

from pydantic import BaseModel

from app.esquemas.participante import ParticipanteDetalheResposta, ParticipanteListaItem


class AcessoAdministracao(BaseModel):
    nome: str
    codigo: str


class TokenResposta(BaseModel):
    token_acesso: str
    tipo_token: str = "bearer"
    expira_em: datetime


class TendenciaResposta(BaseModel):
    predominante: str
    abaixo: int
    acima: int
    igual: int


class ResumoAdministracaoResposta(BaseModel):
    participantes_total: int
    participantes_completos: int
    tentativas_validas_total: int
    tentativas_esperadas: int
    taxa_conclusao_percentual: float
    erro_medio_ms: float
    erro_absoluto_medio_ms: float
    tendencia_geral: TendenciaResposta


class EstatisticaItemResposta(BaseModel):
    chave: str
    quantidade_tentativas: int
    erro_medio_ms: float
    erro_absoluto_medio_ms: float
    abaixo: int
    acima: int
    igual: int
    tendencia_predominante: str


class EstatisticasResposta(BaseModel):
    agrupar_por: str
    itens: list[EstatisticaItemResposta]


class PaginaParticipantesResposta(BaseModel):
    pagina: int
    tamanho: int
    total_itens: int
    total_paginas: int
    itens: list[ParticipanteListaItem]


class ResumoIndividualResposta(BaseModel):
    erro_medio_ms: float
    erro_absoluto_medio_ms: float
    tendencia: TendenciaResposta


class ParticipanteAdministracaoResposta(BaseModel):
    participante: ParticipanteDetalheResposta
    resumo: ResumoIndividualResposta


import re
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.esquemas.tentativa import CombinacaoResposta, TentativaResposta


class ParticipanteAcesso(BaseModel):
    nome: str
    codigo: str

    @field_validator("nome")
    @classmethod
    def validar_nome(cls, valor: str) -> str:
        nome = valor.strip()
        if not nome:
            raise ValueError("nome não pode ser vazio")
        if len(nome) > 120:
            raise ValueError("nome deve ter no máximo 120 caracteres")
        return nome

    @field_validator("codigo")
    @classmethod
    def validar_codigo(cls, valor: str) -> str:
        if not re.fullmatch(r"[0-9]{4}", valor):
            raise ValueError("codigo deve conter exatamente quatro dígitos")
        return valor


class ProgressoResposta(BaseModel):
    concluidas: int
    total: int = 9


class ParticipanteAcessoResposta(BaseModel):
    id: uuid.UUID
    nome: str
    codigo: str
    progresso: ProgressoResposta


class ParticipanteDetalheResposta(ParticipanteAcessoResposta):
    tentativas: list[TentativaResposta]
    tentativas_livres: list[TentativaResposta] = []
    combinacoes: list[CombinacaoResposta]


class ParticipanteListaItem(BaseModel):
    id: uuid.UUID
    nome: str
    codigo: str
    criado_em: datetime
    tentativas_concluidas: int
    situacao: str

    model_config = ConfigDict(from_attributes=True)


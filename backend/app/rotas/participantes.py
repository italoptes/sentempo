import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.banco.conexao import obter_sessao
from app.esquemas.participante import (
    ParticipanteAcesso,
    ParticipanteAcessoResposta,
    ParticipanteDetalheResposta,
)
from app.servicos.participante_servico import ParticipanteServico


roteador = APIRouter(prefix="/participantes", tags=["participantes"])


@roteador.post(
    "/acessar",
    response_model=ParticipanteAcessoResposta,
    responses={201: {"description": "Participante criado"}},
)
async def acessar_participante(
    dados: ParticipanteAcesso,
    resposta: Response,
    sessao: Annotated[Session, Depends(obter_sessao)],
) -> ParticipanteAcessoResposta:
    servico = ParticipanteServico(sessao)
    participante, criado = servico.acessar(dados.nome, dados.codigo)
    if criado:
        resposta.status_code = status.HTTP_201_CREATED
    participante = servico.obter(participante.id) or participante
    return servico.resposta_acesso(participante)


@roteador.get("/{participante_id}", response_model=ParticipanteDetalheResposta)
async def consultar_participante(
    participante_id: uuid.UUID,
    sessao: Annotated[Session, Depends(obter_sessao)],
) -> ParticipanteDetalheResposta:
    servico = ParticipanteServico(sessao)
    participante = servico.obter(participante_id)
    if participante is None:
        raise HTTPException(status_code=404, detail="Participante não encontrado")
    return servico.resposta_detalhe(participante)

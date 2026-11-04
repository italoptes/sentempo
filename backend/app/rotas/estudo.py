import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.banco.conexao import obter_sessao
from app.esquemas.estudo import ResultadoEstudo, SessaoCriacao, SessaoResposta
from app.servicos.estudo_servico import ErroEstudo, EstudoServico

roteador = APIRouter(prefix="/participantes/{participante_id}/estudo-a", tags=["estudo-a"])
Banco = Annotated[Session, Depends(obter_sessao)]


@roteador.get("", response_model=SessaoResposta | None)
def consultar(participante_id: uuid.UUID, banco: Banco):
    sessao = EstudoServico(banco).obter(participante_id)
    return EstudoServico.resposta(sessao) if sessao else None


@roteador.post("", response_model=SessaoResposta)
def criar(participante_id: uuid.UUID, dados: SessaoCriacao, banco: Banco):
    try:
        return EstudoServico.resposta(EstudoServico(banco).criar(participante_id, dados))
    except ErroEstudo as erro:
        raise HTTPException(erro.status, erro.mensagem) from erro


@roteador.post("/tentativas/{tentativa_id}", response_model=SessaoResposta)
def salvar(participante_id: uuid.UUID, tentativa_id: uuid.UUID, dados: ResultadoEstudo, banco: Banco):
    try:
        return EstudoServico.resposta(EstudoServico(banco).salvar(participante_id, tentativa_id, dados))
    except ErroEstudo as erro:
        raise HTTPException(erro.status, erro.mensagem) from erro


@roteador.post("/continuar", response_model=SessaoResposta)
def continuar(participante_id: uuid.UUID, banco: Banco):
    try:
        return EstudoServico.resposta(EstudoServico(banco).continuar(participante_id))
    except ErroEstudo as erro:
        raise HTTPException(erro.status, erro.mensagem) from erro

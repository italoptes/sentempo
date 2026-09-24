import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.banco.conexao import obter_sessao
from app.esquemas.tentativa import TentativaCriacao, TentativaResposta
from app.servicos.tentativa_servico import (
    ParticipanteNaoEncontrado,
    TentativaDuplicada,
    TentativaServico,
)


roteador = APIRouter(prefix="/participantes", tags=["tentativas"])


@roteador.post(
    "/{participante_id}/tentativas",
    response_model=TentativaResposta,
    status_code=status.HTTP_201_CREATED,
)
async def salvar_tentativa(
    participante_id: uuid.UUID,
    dados: TentativaCriacao,
    sessao: Annotated[Session, Depends(obter_sessao)],
) -> TentativaResposta:
    try:
        tentativa = TentativaServico(sessao).salvar(participante_id, dados)
        return TentativaResposta.model_validate(tentativa)
    except ParticipanteNaoEncontrado as erro:
        raise HTTPException(status_code=404, detail="Participante não encontrado") from erro
    except TentativaDuplicada as erro:
        raise HTTPException(
            status_code=409,
            detail="Esta combinação já foi concluída pelo participante",
        ) from erro


@roteador.delete(
    "/{participante_id}/tentativas",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def limpar_tentativas(
    participante_id: uuid.UUID,
    sessao: Annotated[Session, Depends(obter_sessao)],
) -> None:
    try:
        TentativaServico(sessao).excluir_todas_de(participante_id)
    except ParticipanteNaoEncontrado as erro:
        raise HTTPException(status_code=404, detail="Participante não encontrado") from erro


@roteador.delete(
    "/{participante_id}/tentativas/{tentativa_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def excluir_uma_tentativa(
    participante_id: uuid.UUID,
    tentativa_id: uuid.UUID,
    sessao: Annotated[Session, Depends(obter_sessao)],
) -> None:
    try:
        TentativaServico(sessao).excluir_uma(participante_id, tentativa_id)
    except ParticipanteNaoEncontrado as erro:
        raise HTTPException(status_code=404, detail="Participante não encontrado") from erro

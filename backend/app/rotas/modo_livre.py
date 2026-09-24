import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.banco.conexao import obter_sessao
from app.esquemas.modo_livre import ModoLivreStatus, TempoPersonalizadoCriacao, TempoPersonalizadoResposta
from app.servicos.modo_livre_servico import (
    ModoLivreBloqueado,
    ModoLivreServico,
    ParticipanteNaoEncontrado,
    TempoPersonalizadoDuplicado,
    TempoPersonalizadoNaoEncontrado,
)


roteador = APIRouter(prefix="/participantes", tags=["modo_livre"])


@roteador.get(
    "/{participante_id}/modo-livre",
    response_model=ModoLivreStatus,
)
async def obter_status_modo_livre(
    participante_id: uuid.UUID,
    sessao: Annotated[Session, Depends(obter_sessao)],
) -> ModoLivreStatus:
    try:
        return ModoLivreServico(sessao).obter_status(participante_id)
    except ParticipanteNaoEncontrado as erro:
        raise HTTPException(status_code=404, detail="Participante não encontrado") from erro


@roteador.post(
    "/{participante_id}/tempos-personalizados",
    response_model=TempoPersonalizadoResposta,
    status_code=status.HTTP_201_CREATED,
)
async def criar_tempo_personalizado(
    participante_id: uuid.UUID,
    dados: TempoPersonalizadoCriacao,
    sessao: Annotated[Session, Depends(obter_sessao)],
) -> TempoPersonalizadoResposta:
    try:
        tempo = ModoLivreServico(sessao).criar_tempo(participante_id, dados)
        return TempoPersonalizadoResposta.model_validate(tempo)
    except ParticipanteNaoEncontrado as erro:
        raise HTTPException(status_code=404, detail="Participante não encontrado") from erro
    except ModoLivreBloqueado as erro:
        raise HTTPException(status_code=403, detail="Modo livre ainda está bloqueado para este participante") from erro
    except TempoPersonalizadoDuplicado as erro:
        raise HTTPException(status_code=409, detail="Este tempo já foi criado e está ativo") from erro


@roteador.delete(
    "/{participante_id}/tempos-personalizados/{tempo_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def excluir_tempo_personalizado(
    participante_id: uuid.UUID,
    tempo_id: uuid.UUID,
    sessao: Annotated[Session, Depends(obter_sessao)],
) -> None:
    try:
        ModoLivreServico(sessao).excluir_tempo(participante_id, tempo_id)
    except ParticipanteNaoEncontrado as erro:
        raise HTTPException(status_code=404, detail="Participante não encontrado") from erro
    except TempoPersonalizadoNaoEncontrado as erro:
        raise HTTPException(status_code=404, detail="Tempo personalizado não encontrado") from erro

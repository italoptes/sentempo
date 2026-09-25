import math
import uuid
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.banco.conexao import obter_sessao
from app.esquemas.administracao import (
    AcessoAdministracao,
    EstatisticasResposta,
    PaginaParticipantesResposta,
    ParticipanteAdministracaoResposta,
    ResumoAdministracaoResposta,
    TokenResposta,
)
from app.nucleo.configuracoes import Configuracoes, obter_configuracoes
from app.nucleo.dependencias import exigir_administrador
from app.nucleo.limitador import limitador
from app.nucleo.seguranca import credenciais_validas, criar_token
from app.servicos.estatisticas_servico import EstatisticasServico
from app.servicos.exportacao_servico import ExportacaoServico
from app.servicos.participante_servico import ParticipanteServico


roteador = APIRouter(prefix="/administracao", tags=["administração"])


@roteador.post("/acessar", response_model=TokenResposta)
@limitador.limit("5/minute")
async def acessar_administracao(
    request: Request,
    dados: AcessoAdministracao,
    configuracoes: Annotated[Configuracoes, Depends(obter_configuracoes)],
) -> TokenResposta:
    if not credenciais_validas(dados.nome, dados.codigo, configuracoes):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais administrativas inválidas",
        )
    token, expira_em = criar_token(configuracoes)
    return TokenResposta(token_acesso=token, expira_em=expira_em)


@roteador.get(
    "/resumo",
    response_model=ResumoAdministracaoResposta,
    dependencies=[Depends(exigir_administrador)],
)
async def consultar_resumo(
    sessao: Annotated[Session, Depends(obter_sessao)],
) -> ResumoAdministracaoResposta:
    return EstatisticasServico(sessao).resumo()


@roteador.get(
    "/estatisticas",
    response_model=EstatisticasResposta,
    dependencies=[Depends(exigir_administrador)],
)
async def consultar_estatisticas(
    sessao: Annotated[Session, Depends(obter_sessao)],
    agrupar_por: Literal["condicao", "tempo", "tempo_condicao"] = "condicao",
) -> EstatisticasResposta:
    return EstatisticasServico(sessao).estatisticas(agrupar_por)


@roteador.get(
    "/participantes",
    response_model=PaginaParticipantesResposta,
    dependencies=[Depends(exigir_administrador)],
)
async def listar_participantes(
    sessao: Annotated[Session, Depends(obter_sessao)],
    pagina: Annotated[int, Query(ge=1)] = 1,
    tamanho: Annotated[int, Query(ge=1, le=100)] = 20,
    busca: str | None = None,
) -> PaginaParticipantesResposta:
    total, itens = EstatisticasServico(sessao).listar_participantes(pagina, tamanho, busca)
    return PaginaParticipantesResposta(
        pagina=pagina,
        tamanho=tamanho,
        total_itens=total,
        total_paginas=math.ceil(total / tamanho) if total else 0,
        itens=itens,
    )


@roteador.get(
    "/participantes/{participante_id}",
    response_model=ParticipanteAdministracaoResposta,
    dependencies=[Depends(exigir_administrador)],
)
async def detalhar_participante(
    participante_id: uuid.UUID,
    sessao: Annotated[Session, Depends(obter_sessao)],
) -> ParticipanteAdministracaoResposta:
    participante_servico = ParticipanteServico(sessao)
    participante = participante_servico.obter(participante_id)
    if participante is None:
        raise HTTPException(status_code=404, detail="Participante não encontrado")
    return ParticipanteAdministracaoResposta(
        participante=participante_servico.resposta_detalhe(participante),
        resumo=EstatisticasServico.resumo_individual(participante),
    )


@roteador.delete(
    "/participantes/{participante_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(exigir_administrador)],
)
async def excluir_participante(
    participante_id: uuid.UUID,
    sessao: Annotated[Session, Depends(obter_sessao)],
) -> None:
    sucesso = ParticipanteServico(sessao).excluir(participante_id)
    if not sucesso:
        raise HTTPException(status_code=404, detail="Participante não encontrado")

@roteador.get(
    "/exportacao.csv",
    dependencies=[Depends(exigir_administrador)],
)
async def exportar_csv(sessao: Annotated[Session, Depends(obter_sessao)]) -> Response:
    conteudo = ExportacaoServico(sessao).gerar_csv()
    return Response(
        content=conteudo.encode("utf-8"),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="sentempo-resultados.csv"'},
    )

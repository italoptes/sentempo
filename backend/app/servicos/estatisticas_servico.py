import math
import uuid
from collections import defaultdict

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.entidades.participante import Participante
from app.entidades.tentativa import Condicao, Tentativa
from app.esquemas.administracao import (
    EstatisticaItemResposta,
    EstatisticasResposta,
    ResumoAdministracaoResposta,
    ResumoIndividualResposta,
    TendenciaResposta,
)
from app.esquemas.participante import ParticipanteListaItem
from app.repositorios.participantes import RepositorioParticipantes


def identificar_tendencia(abaixo: int, acima: int, igual: int) -> str:
    maior = max(abaixo, acima, igual)
    vencedores = sum(valor == maior for valor in (abaixo, acima, igual))
    if vencedores != 1:
        return "EMPATE"
    if abaixo == maior:
        return "ABAIXO"
    if acima == maior:
        return "ACIMA"
    return "IGUAL"


def criar_tendencia(abaixo: int, acima: int, igual: int) -> TendenciaResposta:
    return TendenciaResposta(
        predominante=identificar_tendencia(abaixo, acima, igual),
        abaixo=abaixo,
        acima=acima,
        igual=igual,
    )


class EstatisticasServico:
    def __init__(self, sessao: Session):
        self.sessao = sessao
        self.participantes = RepositorioParticipantes(sessao)

    def resumo(self) -> ResumoAdministracaoResposta:
        participantes_total = int(self.sessao.scalar(select(func.count(Participante.id))) or 0)
        subconsulta = (
            select(Tentativa.participante_id)
            .group_by(Tentativa.participante_id)
            .having(func.count(Tentativa.id) == 9)
            .subquery()
        )
        participantes_completos = int(
            self.sessao.scalar(select(func.count()).select_from(subconsulta)) or 0
        )
        linha = self.sessao.execute(
            select(
                func.count(Tentativa.id),
                func.coalesce(func.avg(Tentativa.erro_ms), 0),
                func.coalesce(func.avg(Tentativa.erro_absoluto_ms), 0),
                func.sum(case((Tentativa.erro_ms < 0, 1), else_=0)),
                func.sum(case((Tentativa.erro_ms > 0, 1), else_=0)),
                func.sum(case((Tentativa.erro_ms == 0, 1), else_=0)),
            )
        ).one()
        total = int(linha[0] or 0)
        esperadas = participantes_total * 9
        return ResumoAdministracaoResposta(
            participantes_total=participantes_total,
            participantes_completos=participantes_completos,
            tentativas_validas_total=total,
            tentativas_esperadas=esperadas,
            taxa_conclusao_percentual=round((total / esperadas * 100) if esperadas else 0, 2),
            erro_medio_ms=round(float(linha[1] or 0), 3),
            erro_absoluto_medio_ms=round(float(linha[2] or 0), 3),
            tendencia_geral=criar_tendencia(
                int(linha[3] or 0), int(linha[4] or 0), int(linha[5] or 0)
            ),
        )

    def estatisticas(self, agrupar_por: str) -> EstatisticasResposta:
        coluna = Tentativa.condicao if agrupar_por == "condicao" else Tentativa.tempo_alvo_ms
        linhas = self.sessao.execute(
            select(
                coluna,
                func.count(Tentativa.id),
                func.avg(Tentativa.erro_ms),
                func.avg(Tentativa.erro_absoluto_ms),
                func.sum(case((Tentativa.erro_ms < 0, 1), else_=0)),
                func.sum(case((Tentativa.erro_ms > 0, 1), else_=0)),
                func.sum(case((Tentativa.erro_ms == 0, 1), else_=0)),
            ).group_by(coluna)
        ).all()
        por_chave = {
            (linha[0].value if isinstance(linha[0], Condicao) else str(linha[0])): linha
            for linha in linhas
        }
        chaves = (
            [item.value for item in Condicao]
            if agrupar_por == "condicao"
            else ["5000", "15000", "30000"]
        )
        itens: list[EstatisticaItemResposta] = []
        for chave in chaves:
            linha = por_chave.get(chave)
            if linha is None:
                itens.append(
                    EstatisticaItemResposta(
                        chave=chave,
                        quantidade_tentativas=0,
                        erro_medio_ms=0,
                        erro_absoluto_medio_ms=0,
                        abaixo=0,
                        acima=0,
                        igual=0,
                        tendencia_predominante="EMPATE",
                    )
                )
                continue
            abaixo, acima, igual = int(linha[4] or 0), int(linha[5] or 0), int(linha[6] or 0)
            itens.append(
                EstatisticaItemResposta(
                    chave=chave,
                    quantidade_tentativas=int(linha[1]),
                    erro_medio_ms=round(float(linha[2] or 0), 3),
                    erro_absoluto_medio_ms=round(float(linha[3] or 0), 3),
                    abaixo=abaixo,
                    acima=acima,
                    igual=igual,
                    tendencia_predominante=identificar_tendencia(abaixo, acima, igual),
                )
            )
        return EstatisticasResposta(agrupar_por=agrupar_por, itens=itens)

    def listar_participantes(
        self, pagina: int, tamanho: int, busca: str | None
    ) -> tuple[int, list[ParticipanteListaItem]]:
        total = self.participantes.contar(busca)
        entidades = self.participantes.listar(pagina, tamanho, busca)
        itens = [
            ParticipanteListaItem(
                id=item.id,
                nome=item.nome,
                codigo=item.codigo,
                criado_em=item.criado_em,
                tentativas_concluidas=len(item.tentativas),
                situacao="COMPLETO" if len(item.tentativas) == 9 else "INCOMPLETO",
            )
            for item in entidades
        ]
        return total, itens

    @staticmethod
    def resumo_individual(participante: Participante) -> ResumoIndividualResposta:
        tentativas = participante.tentativas
        abaixo = sum(item.erro_ms < 0 for item in tentativas)
        acima = sum(item.erro_ms > 0 for item in tentativas)
        igual = sum(item.erro_ms == 0 for item in tentativas)
        quantidade = len(tentativas)
        erro_medio = sum((item.erro_ms for item in tentativas), start=0) / quantidade if quantidade else 0
        erro_absoluto = (
            sum((item.erro_absoluto_ms for item in tentativas), start=0) / quantidade
            if quantidade
            else 0
        )
        return ResumoIndividualResposta(
            erro_medio_ms=round(float(erro_medio), 3),
            erro_absoluto_medio_ms=round(float(erro_absoluto), 3),
            tendencia=criar_tendencia(abaixo, acima, igual),
        )


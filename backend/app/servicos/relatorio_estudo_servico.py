from decimal import Decimal

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session, selectinload

from app.entidades.estudo import RespostaBloco, SessaoEstudo, TentativaEstudo
from app.entidades.participante import Participante
from app.servicos.estudo_servico import EstudoServico, VERSAO


CONDICOES = ("SEM_ESTIMULO", "LENTO", "RAPIDO")
TEMPOS_ALVO_MS = (5000, 10000, 15000)
REFERENCIA = "SEM_ESTIMULO"


class RelatorioEstudoServico:
    def __init__(self, banco: Session):
        self.banco = banco

    @staticmethod
    def _media(valores: list[Decimal]) -> float | None:
        if not valores:
            return None
        return float(sum(valores, Decimal(0)) / len(valores))

    @staticmethod
    def _percentil(valores: list[Decimal], proporcao: Decimal) -> float | None:
        if not valores:
            return None
        ordenados = sorted(valores)
        posicao = Decimal(len(ordenados) - 1) * proporcao
        inferior = int(posicao)
        superior = min(inferior + 1, len(ordenados) - 1)
        fracao = posicao - inferior
        return float(ordenados[inferior] + (ordenados[superior] - ordenados[inferior]) * fracao)

    @classmethod
    def _resumo_distribuicao(cls, valores: list[Decimal]) -> dict:
        return {
            "mediana": cls._percentil(valores, Decimal("0.5")),
            "q1": cls._percentil(valores, Decimal("0.25")),
            "q3": cls._percentil(valores, Decimal("0.75")),
        }

    def _questionarios(self, linhas: list, por_sessao: dict) -> dict:
        confianca_grupos: dict[tuple[str, int, int | None], dict] = {}
        for linha in linhas:
            if linha.respondida_em is None:
                continue
            chave = (linha.condicao, linha.tempo_alvo_ms, linha.confianca)
            grupo = confianca_grupos.setdefault(chave, {"erros": [], "participantes": set()})
            grupo["erros"].append(linha.erro_absoluto_ms)
            grupo["participantes"].add(linha.participante_id)
        confianca = [{
            "condicao": condicao,
            "tempo_alvo_ms": tempo,
            "nota": nota,
            "tentativas": len(grupo["erros"]),
            "participantes": len(grupo["participantes"]),
            "erro_absoluto_mediano_ms": self._percentil(grupo["erros"], Decimal("0.5")),
        } for (condicao, tempo, nota), grupo in sorted(
            confianca_grupos.items(),
            key=lambda item: (item[0][0], item[0][1], item[0][2] is None, item[0][2] or 0),
        )]

        respostas_blocos = self.banco.execute(
            select(
                RespostaBloco.sessao_id,
                SessaoEstudo.participante_id,
                RespostaBloco.bloco,
                RespostaBloco.agradabilidade,
                RespostaBloco.ansiedade,
            )
            .join(SessaoEstudo, RespostaBloco.sessao_id == SessaoEstudo.id)
            .where(
                SessaoEstudo.versao_protocolo == VERSAO,
                SessaoEstudo.concluida_em.is_not(None),
            )
        ).all()
        condicao_por_bloco = {
            (linha.sessao_id, linha.bloco): linha.condicao
            for linha in linhas
        }
        blocos_grupos: dict[tuple[str, str, int | None], set] = {}
        for resposta in respostas_blocos:
            condicao = condicao_por_bloco.get((resposta.sessao_id, resposta.bloco))
            if condicao is None:
                continue
            for medida, nota in (
                ("AGRADABILIDADE", resposta.agradabilidade),
                ("ANSIEDADE", resposta.ansiedade),
            ):
                blocos_grupos.setdefault((medida, condicao, nota), set()).add(resposta.participante_id)
        respostas_por_bloco = [{
            "medida": medida,
            "condicao": condicao,
            "nota": nota,
            "respostas": len(participantes),
            "participantes": len(participantes),
        } for (medida, condicao, nota), participantes in sorted(
            blocos_grupos.items(),
            key=lambda item: (item[0][0], item[0][1], item[0][2] is None, item[0][2] or 0),
        )]

        sessoes = self.banco.execute(
            select(SessaoEstudo.id, SessaoEstudo.estrategia)
            .where(
                SessaoEstudo.versao_protocolo == VERSAO,
                SessaoEstudo.concluida_em.is_not(None),
            )
        ).all()
        estrategia_por_sessao = {
            sessao.id: sessao.estrategia or "PREFERIU_NAO_RESPONDER"
            for sessao in sessoes
        }
        estrategias_contagem: dict[str, int] = {}
        for categoria in estrategia_por_sessao.values():
            estrategias_contagem[categoria] = estrategias_contagem.get(categoria, 0) + 1
        total_estrategias = len(estrategia_por_sessao)
        estrategias = [{
            "categoria": categoria,
            "participantes": quantidade,
            "percentual": 100 * quantidade / total_estrategias if total_estrategias else 0,
        } for categoria, quantidade in sorted(estrategias_contagem.items())]

        comparacoes_por_estrategia = []
        for categoria in sorted(set(estrategia_por_sessao.values())):
            ids = [sessao_id for sessao_id, valor in estrategia_por_sessao.items() if valor == categoria]
            for tempo in TEMPOS_ALVO_MS:
                for condicao in ("LENTO", "RAPIDO"):
                    pares = []
                    for sessao_id in ids:
                        atual = por_sessao.get((sessao_id, condicao, tempo))
                        referencia = por_sessao.get((sessao_id, REFERENCIA, tempo))
                        if atual is not None and referencia is not None:
                            pares.append((atual, referencia))
                    comparacoes_por_estrategia.append({
                        "estrategia": categoria,
                        "condicao": condicao,
                        "referencia": REFERENCIA,
                        "tempo_alvo_ms": tempo,
                        "pares": len(pares),
                        "diferenca_erro_assinado_media_ms": self._media(
                            [a.erro_ms - r.erro_ms for a, r in pares]
                        ),
                        "diferenca_erro_absoluto_media_ms": self._media(
                            [a.erro_absoluto_ms - r.erro_absoluto_ms for a, r in pares]
                        ),
                    })

        return {
            "confianca": confianca,
            "respostas_por_bloco": respostas_por_bloco,
            "estrategias": estrategias,
            "comparacoes_por_estrategia": comparacoes_por_estrategia,
        }

    def _analise_sessoes_concluidas(self, versao: str) -> dict | None:
        """Calcula a amostra principal sem depender da paginação das sessões.

        A análise nova é deliberadamente restrita à V2: nela existe uma única
        observação por participante, condição e alvo. A consulta traz todas as
        observações válidas em uma única ida ao banco e o pareamento é feito
        pelo identificador da sessão, que representa o participante no estudo.
        """
        if versao != VERSAO:
            return None

        sessoes_concluidas = self.banco.scalar(
            select(func.count(SessaoEstudo.id)).where(
                SessaoEstudo.versao_protocolo == versao,
                SessaoEstudo.concluida_em.is_not(None),
            )
        ) or 0
        linhas = self.banco.execute(
            select(
                TentativaEstudo.sessao_id,
                SessaoEstudo.participante_id,
                TentativaEstudo.condicao,
                TentativaEstudo.tempo_alvo_ms,
                TentativaEstudo.bloco,
                TentativaEstudo.erro_ms,
                TentativaEstudo.erro_absoluto_ms,
                TentativaEstudo.erro_relativo_percentual,
                TentativaEstudo.confianca,
                TentativaEstudo.respondida_em,
            )
            .join(SessaoEstudo)
            .where(
                SessaoEstudo.versao_protocolo == versao,
                SessaoEstudo.concluida_em.is_not(None),
                TentativaEstudo.resultado_ms.is_not(None),
            )
        ).all()

        por_celula: dict[tuple[str, int], list] = {
            (condicao, tempo): []
            for tempo in TEMPOS_ALVO_MS
            for condicao in CONDICOES
        }
        por_sessao: dict[tuple[object, str, int], object] = {}
        for linha in linhas:
            por_celula[(linha.condicao, linha.tempo_alvo_ms)].append(linha)
            por_sessao[(linha.sessao_id, linha.condicao, linha.tempo_alvo_ms)] = linha

        resultados = []
        for tempo in TEMPOS_ALVO_MS:
            for condicao in CONDICOES:
                observacoes = por_celula[(condicao, tempo)]
                resultados.append({
                    "condicao": condicao,
                    "tempo_alvo_ms": tempo,
                    "participantes": len(observacoes),
                    "erro_assinado_medio_ms": self._media([o.erro_ms for o in observacoes]),
                    "erro_absoluto_medio_ms": self._media([o.erro_absoluto_ms for o in observacoes]),
                    "erro_relativo_medio_percentual": self._media(
                        [o.erro_relativo_percentual for o in observacoes]
                    ),
                    "distribuicao": {
                        "erro_assinado": self._resumo_distribuicao([o.erro_ms for o in observacoes]),
                        "erro_absoluto": self._resumo_distribuicao([o.erro_absoluto_ms for o in observacoes]),
                        "erro_relativo": self._resumo_distribuicao(
                            [o.erro_relativo_percentual for o in observacoes]
                        ),
                        "observacoes": [{
                            "codigo_participante": str(o.participante_id),
                            "erro_assinado_ms": float(o.erro_ms),
                            "erro_absoluto_ms": float(o.erro_absoluto_ms),
                            "erro_relativo_percentual": float(o.erro_relativo_percentual),
                        } for o in observacoes],
                    },
                })

        comparacoes = []
        ids_sessoes = {linha.sessao_id for linha in linhas}
        for tempo in TEMPOS_ALVO_MS:
            for condicao in ("LENTO", "RAPIDO"):
                pares = []
                for sessao_id in ids_sessoes:
                    atual = por_sessao.get((sessao_id, condicao, tempo))
                    referencia = por_sessao.get((sessao_id, REFERENCIA, tempo))
                    if atual is not None and referencia is not None:
                        pares.append((atual, referencia))

                diferencas_assinadas = [a.erro_ms - r.erro_ms for a, r in pares]
                diferencas = [{
                    "codigo_participante": str(a.participante_id),
                    "erro_assinado_ms": float(a.erro_ms - r.erro_ms),
                    "erro_absoluto_ms": float(a.erro_absoluto_ms - r.erro_absoluto_ms),
                    "erro_relativo_pp": float(
                        a.erro_relativo_percentual - r.erro_relativo_percentual
                    ),
                } for a, r in pares]
                comparacoes.append({
                    "condicao": condicao,
                    "referencia": REFERENCIA,
                    "tempo_alvo_ms": tempo,
                    "pares": len(pares),
                    "diferenca_erro_assinado_media_ms": self._media(diferencas_assinadas),
                    "diferenca_erro_absoluto_media_ms": self._media(
                        [a.erro_absoluto_ms - r.erro_absoluto_ms for a, r in pares]
                    ),
                    "diferenca_erro_relativo_media_pp": self._media(
                        [a.erro_relativo_percentual - r.erro_relativo_percentual for a, r in pares]
                    ),
                    "mais_cedo": sum(diferenca < 0 for diferenca in diferencas_assinadas),
                    "mais_tarde": sum(diferenca > 0 for diferenca in diferencas_assinadas),
                    "mesmo_tempo": sum(diferenca == 0 for diferenca in diferencas_assinadas),
                    "diferencas_individuais": diferencas,
                })

        return {
            "criterio_inclusao": "SESSOES_CONCLUIDAS",
            "participantes": sessoes_concluidas,
            "resultados": resultados,
            "comparacoes": comparacoes,
            "questionarios": self._questionarios(linhas, por_sessao),
        }

    def painel(self, pagina: int, tamanho: int, versao: str = VERSAO) -> dict:
        sessoes_total = self.banco.scalar(select(func.count(SessaoEstudo.id)).where(SessaoEstudo.versao_protocolo == versao)) or 0
        sessoes_completas = self.banco.scalar(select(func.count(SessaoEstudo.id)).where(SessaoEstudo.versao_protocolo == versao, SessaoEstudo.concluida_em.is_not(None))) or 0
        linhas = self.banco.execute(select(
            TentativaEstudo.condicao, TentativaEstudo.tempo_alvo_ms, func.count(TentativaEstudo.id),
            func.avg(TentativaEstudo.erro_ms), func.avg(TentativaEstudo.erro_absoluto_ms),
            func.avg(TentativaEstudo.erro_relativo_percentual),
            func.sum(case((TentativaEstudo.erro_ms < 0, 1), else_=0)),
            func.sum(case((TentativaEstudo.erro_ms > 0, 1), else_=0)),
            func.sum(case((TentativaEstudo.erro_ms == 0, 1), else_=0)),
        ).join(SessaoEstudo).where(SessaoEstudo.versao_protocolo == versao, TentativaEstudo.resultado_ms.is_not(None))
          .group_by(TentativaEstudo.condicao, TentativaEstudo.tempo_alvo_ms)
          .order_by(TentativaEstudo.condicao, TentativaEstudo.tempo_alvo_ms)).all()
        estatisticas = [{"condicao": l[0], "tempo_alvo_ms": l[1], "quantidade": l[2],
            "erro_medio_ms": float(l[3]), "erro_absoluto_medio_ms": float(l[4]), "erro_relativo_medio_percentual": float(l[5]),
            "abaixo": l[6], "acima": l[7], "igual": l[8]} for l in linhas]
        sessoes = self.banco.execute(select(SessaoEstudo, Participante.nome).join(Participante, SessaoEstudo.participante_id == Participante.id)
            .where(SessaoEstudo.versao_protocolo == versao)
            .options(selectinload(SessaoEstudo.tentativas), selectinload(SessaoEstudo.respostas_blocos))
            .order_by(SessaoEstudo.consentido_em.desc(), SessaoEstudo.id).offset((pagina - 1) * tamanho).limit(tamanho)).all()
        return {"versao_protocolo": versao, "sessoes_total": sessoes_total, "sessoes_completas": sessoes_completas,
            "tentativas_concluidas": sum(e["quantidade"] for e in estatisticas), "estatisticas": estatisticas,
            "analise": self._analise_sessoes_concluidas(versao),
            "pagina": pagina, "tamanho": tamanho, "total_paginas": (sessoes_total + tamanho - 1) // tamanho,
            "sessoes": [{"codigo_participante": str(s.participante_id), "nome_participante": nome,
                **EstudoServico.resposta(s, administrativo=True).model_dump(mode="json")} for s, nome in sessoes]}

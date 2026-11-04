from sqlalchemy import case, func, select
from sqlalchemy.orm import Session, selectinload

from app.entidades.estudo import SessaoEstudo, TentativaEstudo
from app.servicos.estudo_servico import EstudoServico, VERSAO


class RelatorioEstudoServico:
    def __init__(self, banco: Session):
        self.banco = banco

    def painel(self, pagina: int, tamanho: int) -> dict:
        sessoes_total = self.banco.scalar(select(func.count(SessaoEstudo.id)).where(SessaoEstudo.versao_protocolo == VERSAO)) or 0
        sessoes_completas = self.banco.scalar(select(func.count(SessaoEstudo.id)).where(SessaoEstudo.versao_protocolo == VERSAO, SessaoEstudo.concluida_em.is_not(None))) or 0
        linhas = self.banco.execute(select(
            TentativaEstudo.condicao, TentativaEstudo.tempo_alvo_ms, func.count(TentativaEstudo.id),
            func.avg(TentativaEstudo.erro_ms), func.avg(TentativaEstudo.erro_absoluto_ms),
            func.avg(TentativaEstudo.erro_relativo_percentual),
            func.sum(case((TentativaEstudo.erro_ms < 0, 1), else_=0)),
            func.sum(case((TentativaEstudo.erro_ms > 0, 1), else_=0)),
            func.sum(case((TentativaEstudo.erro_ms == 0, 1), else_=0)),
        ).join(SessaoEstudo).where(SessaoEstudo.versao_protocolo == VERSAO, TentativaEstudo.resultado_ms.is_not(None))
          .group_by(TentativaEstudo.condicao, TentativaEstudo.tempo_alvo_ms)
          .order_by(TentativaEstudo.condicao, TentativaEstudo.tempo_alvo_ms)).all()
        estatisticas = [{"condicao": l[0], "tempo_alvo_ms": l[1], "quantidade": l[2],
            "erro_medio_ms": float(l[3]), "erro_absoluto_medio_ms": float(l[4]), "erro_relativo_medio_percentual": float(l[5]),
            "abaixo": l[6], "acima": l[7], "igual": l[8]} for l in linhas]
        sessoes = self.banco.scalars(select(SessaoEstudo).where(SessaoEstudo.versao_protocolo == VERSAO)
            .options(selectinload(SessaoEstudo.tentativas), selectinload(SessaoEstudo.respostas_blocos))
            .order_by(SessaoEstudo.consentido_em.desc(), SessaoEstudo.id).offset((pagina - 1) * tamanho).limit(tamanho)).all()
        return {"versao_protocolo": VERSAO, "sessoes_total": sessoes_total, "sessoes_completas": sessoes_completas,
            "tentativas_concluidas": sum(e["quantidade"] for e in estatisticas), "estatisticas": estatisticas,
            "pagina": pagina, "tamanho": tamanho, "total_paginas": (sessoes_total + tamanho - 1) // tamanho,
            "sessoes": [{"codigo_participante": str(s.participante_id), **EstudoServico.resposta(s, administrativo=True).model_dump(mode="json")} for s in sessoes]}

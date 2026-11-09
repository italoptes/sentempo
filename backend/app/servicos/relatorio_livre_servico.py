from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.entidades.tentativa import Tentativa


class RelatorioLivreServico:
    def __init__(self, banco: Session):
        self.banco = banco

    def painel(self, pagina: int, tamanho: int) -> dict:
        # Todos os jogos usam Tentativa; a pesquisa usa TentativaEstudo.
        total, participantes, tempos = self.banco.execute(select(
            func.count(Tentativa.id), func.count(func.distinct(Tentativa.participante_id)),
            func.count(func.distinct(Tentativa.tempo_alvo_ms)),
        )).one()
        estatisticas = self.banco.execute(select(
            Tentativa.condicao, Tentativa.tempo_alvo_ms, func.count(Tentativa.id),
            func.avg(Tentativa.erro_ms), func.avg(Tentativa.erro_absoluto_ms),
        ).group_by(Tentativa.condicao, Tentativa.tempo_alvo_ms)
          .order_by(Tentativa.tempo_alvo_ms, Tentativa.condicao)).all()
        tentativas = self.banco.scalars(select(Tentativa)
            .order_by(Tentativa.criado_em.desc(), Tentativa.id)
            .offset((pagina - 1) * tamanho).limit(tamanho)).all()
        return {
            "participantes_total": participantes, "tentativas_total": total, "tempos_total": tempos,
            "pagina": pagina, "total_paginas": (total + tamanho - 1) // tamanho,
            "estatisticas": [{"condicao": e[0].value, "tempo_alvo_ms": e[1], "quantidade": e[2],
                "erro_medio_ms": float(e[3]), "erro_absoluto_medio_ms": float(e[4])} for e in estatisticas],
            "tentativas": [{"id": str(t.id), "participante_id": str(t.participante_id),
                "tempo_alvo_ms": t.tempo_alvo_ms, "condicao": t.condicao.value,
                "resultado_ms": float(t.resultado_ms), "erro_ms": float(t.erro_ms),
                "erro_absoluto_ms": float(t.erro_absoluto_ms), "criado_em": t.criado_em.isoformat()}
                for t in tentativas],
        }

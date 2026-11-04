import csv
import io
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.entidades.estudo import SessaoEstudo, TentativaEstudo
from app.entidades.tentativa import Tentativa, TipoTentativa

CABECALHO = [
    "codigo_participante", "origem", "sessao_id", "versao_protocolo", "sequencia", "condicao",
    "tempo_alvo_ms", "bloco", "ordem", "repeticao", "resultado_ms", "erro_ms", "erro_absoluto_ms",
    "erro_relativo_percentual", "concluida_em", "dispositivo", "usa_fones", "volume",
    "consentido_em", "sessao_concluida_em", "confianca", "confianca_respondida_em",
    "agradabilidade", "ansiedade", "bloco_respondido_em", "estrategia", "comentario",
]


def celula_segura(valor):
    # Comentários são texto livre; não podem virar fórmulas ao abrir em planilha.
    if isinstance(valor, str) and valor.lstrip().startswith(("=", "+", "-", "@")):
        return "'" + valor
    return valor


class ExportacaoServico:
    def __init__(self, sessao: Session):
        self.sessao = sessao

    def gerar_csv(self, origem: str = "ANTERIOR") -> str:
        arquivo = io.StringIO()
        arquivo.write("\ufeff")
        escritor = csv.DictWriter(arquivo, fieldnames=CABECALHO, delimiter=";", lineterminator="\n")
        escritor.writeheader()
        if origem in ("ANTERIOR", "LIVRE"):
            tipo = TipoTentativa.OFICIAL if origem == "ANTERIOR" else TipoTentativa.PERSONALIZADA
            consulta = select(Tentativa).where(Tentativa.tipo_tentativa == tipo).order_by(Tentativa.criado_em, Tentativa.id)
            for t in self.sessao.scalars(consulta):
                escritor.writerow({"codigo_participante": str(t.participante_id), "origem": origem,
                    "versao_protocolo": "ANTERIOR_V1" if origem == "ANTERIOR" else "MODO_LIVRE",
                    "condicao": t.condicao.value, "tempo_alvo_ms": t.tempo_alvo_ms,
                    "resultado_ms": format(t.resultado_ms, ".3f"), "erro_ms": format(t.erro_ms, ".3f"),
                    "erro_absoluto_ms": format(t.erro_absoluto_ms, ".3f"),
                    "erro_relativo_percentual": format(100 * t.erro_ms / Decimal(t.tempo_alvo_ms), ".6f"),
                    "concluida_em": t.criado_em.isoformat()})
        elif origem == "ESTUDO_A":
            consulta = (select(TentativaEstudo, SessaoEstudo).join(SessaoEstudo)
                .options(selectinload(SessaoEstudo.respostas_blocos))
                .where(TentativaEstudo.resultado_ms.is_not(None))
                .order_by(SessaoEstudo.consentido_em, SessaoEstudo.id, TentativaEstudo.ordem))
            for t, s in self.sessao.execute(consulta):
                bloco = next((r for r in s.respostas_blocos if r.bloco == t.bloco), None)
                escritor.writerow({"codigo_participante": str(s.participante_id), "origem": origem,
                    "sessao_id": str(s.id), "versao_protocolo": s.versao_protocolo, "sequencia": s.sequencia,
                    "condicao": t.condicao, "tempo_alvo_ms": t.tempo_alvo_ms, "bloco": t.bloco,
                    "ordem": t.ordem, "repeticao": t.repeticao, "resultado_ms": format(t.resultado_ms, ".3f"),
                    "erro_ms": format(t.erro_ms, ".3f"), "erro_absoluto_ms": format(t.erro_absoluto_ms, ".3f"),
                    "erro_relativo_percentual": format(t.erro_relativo_percentual, ".6f"),
                    "concluida_em": t.concluida_em.isoformat(), "dispositivo": s.dispositivo,
                    "usa_fones": s.usa_fones, "volume": s.volume, "consentido_em": s.consentido_em.isoformat(),
                    "sessao_concluida_em": s.concluida_em.isoformat() if s.concluida_em else None,
                    "confianca": t.confianca, "confianca_respondida_em": t.respondida_em.isoformat() if t.respondida_em else None,
                    "agradabilidade": bloco.agradabilidade if bloco else None, "ansiedade": bloco.ansiedade if bloco else None,
                    "bloco_respondido_em": bloco.respondida_em.isoformat() if bloco else None,
                    "estrategia": s.estrategia, "comentario": celula_segura(s.comentario)})
        return arquivo.getvalue()


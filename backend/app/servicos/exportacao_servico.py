import csv
import io

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.entidades.participante import Participante
from app.entidades.tentativa import Tentativa


CABECALHO = [
    "participante_id",
    "nome",
    "codigo",
    "tempo_alvo_ms",
    "condicao",
    "resultado_ms",
    "erro_ms",
    "erro_absoluto_ms",
    "criado_em",
]


class ExportacaoServico:
    def __init__(self, sessao: Session):
        self.sessao = sessao

    def gerar_csv(self) -> str:
        arquivo = io.StringIO()
        arquivo.write("\ufeff")
        escritor = csv.writer(arquivo, delimiter=";", lineterminator="\n")
        escritor.writerow(CABECALHO)
        consulta = (
            select(Tentativa, Participante)
            .join(Participante, Participante.id == Tentativa.participante_id)
            .order_by(Tentativa.criado_em.asc())
        )
        for tentativa, participante in self.sessao.execute(consulta).all():
            escritor.writerow(
                [
                    str(participante.id),
                    participante.nome,
                    participante.codigo,
                    tentativa.tempo_alvo_ms,
                    tentativa.condicao.value,
                    format(tentativa.resultado_ms, ".3f"),
                    format(tentativa.erro_ms, ".3f"),
                    format(tentativa.erro_absoluto_ms, ".3f"),
                    tentativa.criado_em.isoformat(),
                ]
            )
        return arquivo.getvalue()


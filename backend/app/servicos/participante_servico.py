import unicodedata
import uuid

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.entidades.participante import Participante
from app.entidades.tentativa import Condicao
from app.esquemas.participante import (
    ParticipanteAcessoResposta,
    ParticipanteDetalheResposta,
    ProgressoResposta,
)
from app.esquemas.tentativa import CombinacaoResposta, TentativaResposta
from app.repositorios.participantes import RepositorioParticipantes


TEMPOS = (5000, 15000, 30000)
CONDICOES = (Condicao.SEM_ESTIMULO, Condicao.RAPIDO, Condicao.LENTO)


def normalizar_nome(nome: str) -> str:
    nome_sem_espacos_extras = " ".join(nome.strip().split())
    return unicodedata.normalize("NFKC", nome_sem_espacos_extras).casefold()


class ParticipanteServico:
    def __init__(self, sessao: Session):
        self.sessao = sessao
        self.repositorio = RepositorioParticipantes(sessao)

    def acessar(self, nome: str, codigo: str) -> tuple[Participante, bool]:
        nome_limpo = " ".join(nome.strip().split())
        nome_normalizado = normalizar_nome(nome_limpo)
        participante = self.repositorio.buscar_por_acesso(nome_normalizado, codigo)
        if participante:
            return participante, False
        try:
            participante = self.repositorio.criar(nome_limpo, nome_normalizado, codigo)
            self.sessao.commit()
            return participante, True
        except IntegrityError:
            self.sessao.rollback()
            participante = self.repositorio.buscar_por_acesso(nome_normalizado, codigo)
            if participante is None:
                raise
            return participante, False

    def obter(self, participante_id: uuid.UUID) -> Participante | None:
        return self.repositorio.buscar_por_id(participante_id)

    @staticmethod
    def resposta_acesso(participante: Participante) -> ParticipanteAcessoResposta:
        quantidade = len(participante.tentativas)
        return ParticipanteAcessoResposta(
            id=participante.id,
            nome=participante.nome,
            codigo=participante.codigo,
            progresso=ProgressoResposta(concluidas=quantidade),
        )

    @staticmethod
    def resposta_detalhe(participante: Participante) -> ParticipanteDetalheResposta:
        tentativas_ordenadas = sorted(
            participante.tentativas,
            key=lambda item: (item.tempo_alvo_ms, item.condicao.value),
        )
        concluidas = {
            (tentativa.tempo_alvo_ms, tentativa.condicao)
            for tentativa in tentativas_ordenadas
        }
        combinacoes = [
            CombinacaoResposta(
                tempo_alvo_ms=tempo,
                condicao=condicao,
                concluida=(tempo, condicao) in concluidas,
            )
            for tempo in TEMPOS
            for condicao in CONDICOES
        ]
        return ParticipanteDetalheResposta(
            id=participante.id,
            nome=participante.nome,
            codigo=participante.codigo,
            progresso=ProgressoResposta(concluidas=len(tentativas_ordenadas)),
            tentativas=[TentativaResposta.model_validate(item) for item in tentativas_ordenadas],
            combinacoes=combinacoes,
        )


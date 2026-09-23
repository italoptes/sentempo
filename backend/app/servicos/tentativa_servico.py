import uuid
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.entidades.tentativa import Tentativa
from app.esquemas.tentativa import TentativaCriacao
from app.repositorios.participantes import RepositorioParticipantes
from app.repositorios.tentativas import RepositorioTentativas


class ParticipanteNaoEncontrado(Exception):
    pass


class TentativaDuplicada(Exception):
    pass


class TentativaServico:
    def __init__(self, sessao: Session):
        self.sessao = sessao
        self.participantes = RepositorioParticipantes(sessao)
        self.tentativas = RepositorioTentativas(sessao)

    def salvar(self, participante_id: uuid.UUID, dados: TentativaCriacao) -> Tentativa:
        participante = self.participantes.buscar_por_id(participante_id)
        if participante is None:
            raise ParticipanteNaoEncontrado
        if self.tentativas.buscar_combinacao(
            participante_id, dados.tempo_alvo_ms, dados.condicao
        ):
            raise TentativaDuplicada

        precisao = Decimal("0.001")
        resultado = Decimal(str(dados.resultado_ms)).quantize(precisao, rounding=ROUND_HALF_UP)
        alvo = Decimal(dados.tempo_alvo_ms)
        erro = (resultado - alvo).quantize(precisao)
        tentativa = Tentativa(
            participante_id=participante_id,
            tempo_alvo_ms=dados.tempo_alvo_ms,
            condicao=dados.condicao,
            resultado_ms=resultado,
            erro_ms=erro,
            erro_absoluto_ms=abs(erro),
        )
        try:
            self.tentativas.criar(tentativa)
            self.sessao.commit()
            self.sessao.refresh(tentativa)
            return tentativa
        except IntegrityError as erro_banco:
            self.sessao.rollback()
            raise TentativaDuplicada from erro_banco


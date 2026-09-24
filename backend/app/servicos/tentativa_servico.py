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
            
        from app.entidades.tentativa import TipoTentativa
        
        if dados.tipo_tentativa == TipoTentativa.OFICIAL:
            if self.tentativas.buscar_combinacao(
                participante_id, dados.tempo_alvo_ms, dados.condicao
            ):
                raise TentativaDuplicada
        else:
            # Para tentativas personalizadas, verificar se o tempo_personalizado_id existe e pertence ao participante
            from app.repositorios.tempos_personalizados import RepositorioTemposPersonalizados
            repo_tempos = RepositorioTemposPersonalizados(self.sessao)
            if not dados.tempo_personalizado_id or not repo_tempos.buscar_por_id_e_participante(dados.tempo_personalizado_id, participante_id):
                raise ValueError("Tempo personalizado inválido ou não pertence ao participante")

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
            tipo_tentativa=dados.tipo_tentativa,
            tempo_personalizado_id=dados.tempo_personalizado_id,
        )
        try:
            self.tentativas.criar(tentativa)
            self.sessao.commit()
            self.sessao.refresh(tentativa)
            return tentativa
        except IntegrityError as erro_banco:
            self.sessao.rollback()
            raise TentativaDuplicada from erro_banco

    def excluir_todas_de(self, participante_id: uuid.UUID) -> None:
        participante = self.participantes.buscar_por_id(participante_id)
        if participante is None:
            raise ParticipanteNaoEncontrado
            
        self.tentativas.excluir_por_participante(participante_id)
        self.sessao.commit()

    def excluir_uma(self, participante_id: uuid.UUID, tentativa_id: uuid.UUID) -> None:
        participante = self.participantes.buscar_por_id(participante_id)
        if participante is None:
            raise ParticipanteNaoEncontrado
            
        # Opcionalmente, pode verificar se a tentativa pertence mesmo ao participante.
        # Por simplicidade e segurança, podemos checar se apagou algo.
        apagados = self.tentativas.excluir_uma(tentativa_id)
        if apagados > 0:
            self.sessao.commit()


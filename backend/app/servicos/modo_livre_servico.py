import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.entidades.tempo_personalizado import TempoPersonalizado
from app.entidades.tentativa import Tentativa, TipoTentativa
from app.esquemas.modo_livre import TempoPersonalizadoCriacao, ModoLivreStatus, TempoPersonalizadoResposta
from app.repositorios.participantes import RepositorioParticipantes
from app.repositorios.tempos_personalizados import RepositorioTemposPersonalizados


class ParticipanteNaoEncontrado(Exception):
    pass


class ModoLivreBloqueado(Exception):
    pass


class TempoPersonalizadoDuplicado(Exception):
    pass


class TempoPersonalizadoNaoEncontrado(Exception):
    pass


class ModoLivreServico:
    def __init__(self, sessao: Session):
        self.sessao = sessao
        self.participantes = RepositorioParticipantes(sessao)
        self.tempos = RepositorioTemposPersonalizados(sessao)

    def _verificar_participante(self, participante_id: uuid.UUID) -> None:
        if not self.participantes.buscar_por_id(participante_id):
            raise ParticipanteNaoEncontrado

    def esta_desbloqueado(self, participante_id: uuid.UUID) -> bool:
        self._verificar_participante(participante_id)

        consulta = select(Tentativa.tempo_alvo_ms).where(
            Tentativa.participante_id == participante_id,
            Tentativa.tipo_tentativa == TipoTentativa.OFICIAL,
            Tentativa.tempo_alvo_ms.in_([15000, 30000])
        ).distinct()

        tempos_realizados = set(self.sessao.scalars(consulta).all())
        return {15000, 30000}.issubset(tempos_realizados)

    def obter_status(self, participante_id: uuid.UUID) -> ModoLivreStatus:
        desbloqueado = self.esta_desbloqueado(participante_id)
        if not desbloqueado:
            return ModoLivreStatus(desbloqueado=False, tempos=[])
            
        tempos_ativos = self.tempos.listar_ativos(participante_id)
        return ModoLivreStatus(
            desbloqueado=True,
            tempos=[TempoPersonalizadoResposta.model_validate(t) for t in tempos_ativos]
        )

    def criar_tempo(
        self, participante_id: uuid.UUID, dados: TempoPersonalizadoCriacao
    ) -> TempoPersonalizado:
        if not self.esta_desbloqueado(participante_id):
            raise ModoLivreBloqueado

        if self.tempos.buscar_por_tempo_e_participante(dados.tempo_alvo_ms, participante_id):
            raise TempoPersonalizadoDuplicado

        tempo = TempoPersonalizado(
            participante_id=participante_id,
            tempo_alvo_ms=dados.tempo_alvo_ms,
        )
        try:
            self.tempos.criar(tempo)
            self.sessao.commit()
            self.sessao.refresh(tempo)
            return tempo
        except IntegrityError as erro:
            self.sessao.rollback()
            raise TempoPersonalizadoDuplicado from erro

    def excluir_tempo(self, participante_id: uuid.UUID, tempo_id: uuid.UUID) -> None:
        self._verificar_participante(participante_id)
        
        tempo = self.tempos.buscar_por_id_e_participante(tempo_id, participante_id)
        if not tempo:
            raise TempoPersonalizadoNaoEncontrado
            
        self.tempos.inativar(tempo)
        self.sessao.commit()

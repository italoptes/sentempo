import random
import uuid
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from itertools import permutations

from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert as inserir_postgres
from sqlalchemy.dialects.sqlite import insert as inserir_sqlite
from sqlalchemy.orm import Session, selectinload

from app.entidades.estudo import DistribuicaoProtocolo, SessaoEstudo, TentativaEstudo
from app.entidades.participante import Participante
from app.esquemas.estudo import BlocoResposta, PosicaoResposta, ResultadoEstudo, SessaoCriacao, SessaoResposta

VERSAO = "ESTUDO_A_V1"
SEQUENCIAS = tuple(permutations(("SEM_ESTIMULO", "LENTO", "RAPIDO")))


class ErroEstudo(Exception):
    def __init__(self, status: int, mensagem: str):
        self.status = status
        self.mensagem = mensagem


class EstudoServico:
    def __init__(self, banco: Session):
        self.banco = banco

    def obter(self, participante_id: uuid.UUID, bloquear: bool = False) -> SessaoEstudo | None:
        consulta = select(SessaoEstudo).where(
            SessaoEstudo.participante_id == participante_id, SessaoEstudo.versao_protocolo == VERSAO
        ).options(selectinload(SessaoEstudo.tentativas)).execution_options(populate_existing=True)
        if bloquear:
            consulta = consulta.with_for_update()
        return self.banco.scalar(consulta)

    def criar(self, participante_id: uuid.UUID, dados: SessaoCriacao) -> SessaoEstudo:
        # Serializa criação/retomada para o mesmo participante antes da distribuição.
        participante = self.banco.scalar(select(Participante).where(Participante.id == participante_id).with_for_update())
        if participante is None:
            raise ErroEstudo(404, "Participante não encontrado")
        existente = self.obter(participante_id)
        if existente:
            return existente
        inserir = inserir_postgres if self.banco.bind.dialect.name == "postgresql" else inserir_sqlite
        self.banco.execute(inserir(DistribuicaoProtocolo).values(versao=VERSAO, proxima=0).on_conflict_do_nothing())
        # UPDATE ... RETURNING adquire lock e incrementa dentro da mesma transação.
        indice = self.banco.scalar(update(DistribuicaoProtocolo).where(
            DistribuicaoProtocolo.versao == VERSAO
        ).values(proxima=DistribuicaoProtocolo.proxima + 1).returning(DistribuicaoProtocolo.proxima)) - 1
        # Reconsulta depois do lock global também cobre criação concorrente em SQLite.
        existente = self.obter(participante_id)
        if existente:
            self.banco.rollback()
            return self.obter(participante_id)
        sessao = SessaoEstudo(participante_id=participante_id, versao_protocolo=VERSAO,
                             sequencia=indice % 6, bloco_liberado=1, dispositivo=dados.dispositivo,
                             usa_fones=dados.usa_fones, volume=dados.volume)
        for bloco, condicao in enumerate(SEQUENCIAS[sessao.sequencia], 1):
            combinacoes = [(tempo, repeticao) for tempo in (5000, 10000, 15000) for repeticao in (1, 2, 3)]
            random.SystemRandom().shuffle(combinacoes)
            for posicao, (tempo, repeticao) in enumerate(combinacoes, 1):
                sessao.tentativas.append(TentativaEstudo(ordem=(bloco - 1) * 9 + posicao,
                    bloco=bloco, condicao=condicao, tempo_alvo_ms=tempo, repeticao=repeticao))
        self.banco.add(sessao)
        self.banco.commit()
        return self.obter(participante_id)

    def exigir(self, participante_id: uuid.UUID) -> SessaoEstudo:
        sessao = self.obter(participante_id, bloquear=True)
        if sessao is None:
            raise ErroEstudo(404, "Sessão não encontrada")
        return sessao

    def salvar(self, participante_id: uuid.UUID, tentativa_id: uuid.UUID, dados: ResultadoEstudo) -> SessaoEstudo:
        sessao = self.exigir(participante_id)
        proxima = next((t for t in sessao.tentativas if t.resultado_ms is None), None)
        if proxima is None or proxima.id != tentativa_id:
            raise ErroEstudo(409, "Tentativa já confirmada ou fora da sequência. Consulte a sessão.")
        if proxima.bloco > sessao.bloco_liberado:
            raise ErroEstudo(409, "Continue após o intervalo antes de iniciar o próximo bloco")
        precisao = Decimal("0.001")
        resultado = dados.resultado_ms.quantize(precisao, rounding=ROUND_HALF_UP)
        if resultado <= 0:
            raise ErroEstudo(422, "Duração abaixo da precisão de armazenamento")
        erro = resultado - Decimal(proxima.tempo_alvo_ms)
        agora = datetime.now(timezone.utc)
        # Compare-and-set também impede sobrescrita em bancos sem SELECT FOR UPDATE.
        alteradas = self.banco.execute(update(TentativaEstudo).where(
            TentativaEstudo.id == tentativa_id, TentativaEstudo.resultado_ms.is_(None)
        ).values(resultado_ms=resultado, erro_ms=erro, erro_absoluto_ms=abs(erro),
            erro_relativo_percentual=(100 * erro / proxima.tempo_alvo_ms).quantize(Decimal("0.000001")),
            concluida_em=agora).execution_options(synchronize_session=False)).rowcount
        if alteradas != 1:
            self.banco.rollback()
            raise ErroEstudo(409, "Tentativa já confirmada. Consulte a sessão.")
        if proxima.ordem == 27:
            sessao.concluida_em = agora
        self.banco.commit()
        return self.obter(participante_id)

    def continuar(self, participante_id: uuid.UUID) -> SessaoEstudo:
        sessao = self.exigir(participante_id)
        proxima = next((t for t in sessao.tentativas if t.resultado_ms is None), None)
        if proxima is None or proxima.bloco != sessao.bloco_liberado + 1:
            raise ErroEstudo(409, "Não há próximo bloco aguardando continuação")
        sessao.bloco_liberado = proxima.bloco
        self.banco.commit()
        return self.obter(participante_id)

    @staticmethod
    def resposta(sessao: SessaoEstudo, administrativo: bool = False) -> SessaoResposta:
        revelar = administrativo or sessao.concluida_em is not None
        posicoes = [PosicaoResposta(id=t.id, ordem=t.ordem, bloco=t.bloco, repeticao=t.repeticao,
            condicao=t.condicao, tempo_alvo_ms=t.tempo_alvo_ms, concluida=t.resultado_ms is not None,
            **({campo: getattr(t, campo) for campo in ("resultado_ms", "erro_ms", "erro_absoluto_ms", "erro_relativo_percentual")} if revelar else {}))
            for t in sorted(sessao.tentativas, key=lambda t: t.ordem)]
        proxima = next((t for t in posicoes if not t.concluida), None)
        situacao = "CONCLUIDA" if proxima is None else "INTERVALO" if proxima.bloco > sessao.bloco_liberado else "EM_ANDAMENTO"
        return SessaoResposta(id=sessao.id, versao_protocolo=sessao.versao_protocolo, sequencia=sessao.sequencia,
            ordem_condicoes=list(SEQUENCIAS[sessao.sequencia]), dispositivo=sessao.dispositivo,
            usa_fones=sessao.usa_fones, volume=sessao.volume, consentido_em=sessao.consentido_em,
            concluida_em=sessao.concluida_em, bloco_liberado=sessao.bloco_liberado,
            concluidas=sum(t.concluida for t in posicoes), situacao=situacao, proxima=proxima,
            blocos=[BlocoResposta(posicao=i, condicao=condicao, concluidas=sum(t.concluida and t.bloco == i for t in posicoes))
                    for i, condicao in enumerate(SEQUENCIAS[sessao.sequencia], 1)], tentativas=posicoes)

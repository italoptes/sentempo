"""Sessões e posições persistidas do Estudo A, separadas do protocolo anterior."""
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Integer, Numeric, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.banco.base import Base


class DistribuicaoProtocolo(Base):
    __tablename__ = "distribuicoes_protocolos"
    versao: Mapped[str] = mapped_column(String(40), primary_key=True)
    proxima: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class SessaoEstudo(Base):
    __tablename__ = "sessoes_estudo"
    __table_args__ = (
        UniqueConstraint("participante_id", "versao_protocolo", name="uq_sessao_participante_versao"),
        CheckConstraint("sequencia >= 0 AND sequencia < 6", name="ck_sessao_sequencia"),
        CheckConstraint("bloco_liberado BETWEEN 1 AND 3", name="ck_sessao_bloco"),
        CheckConstraint("volume BETWEEN 0.1 AND 1", name="ck_sessao_volume"),
        CheckConstraint("dispositivo IN ('COMPUTADOR', 'CELULAR', 'TABLET', 'OUTRO')", name="ck_sessao_dispositivo"),
    )
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    participante_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("participantes.id", ondelete="CASCADE"), index=True)
    versao_protocolo: Mapped[str] = mapped_column(String(40), nullable=False)
    sequencia: Mapped[int] = mapped_column(Integer, nullable=False)
    bloco_liberado: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    dispositivo: Mapped[str] = mapped_column(String(20), nullable=False)
    usa_fones: Mapped[bool] = mapped_column(Boolean, nullable=False)
    volume: Mapped[Decimal] = mapped_column(Numeric(3, 2), nullable=False)
    consentido_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    concluida_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    estrategia: Mapped[str | None] = mapped_column(String(30))
    comentario: Mapped[str | None] = mapped_column(String(300))
    tentativas: Mapped[list["TentativaEstudo"]] = relationship(cascade="all, delete-orphan", order_by="TentativaEstudo.ordem")
    respostas_blocos: Mapped[list["RespostaBloco"]] = relationship(cascade="all, delete-orphan", order_by="RespostaBloco.bloco")


class TentativaEstudo(Base):
    __tablename__ = "tentativas_estudo"
    __table_args__ = (
        UniqueConstraint("sessao_id", "ordem", name="uq_estudo_sessao_ordem"),
        UniqueConstraint("sessao_id", "condicao", "tempo_alvo_ms", "repeticao", name="uq_estudo_repeticao"),
        CheckConstraint("tamanho_bloco IN (3, 9)", name="ck_estudo_tamanho_bloco"),
        CheckConstraint("ordem BETWEEN 1 AND 3 * tamanho_bloco AND bloco BETWEEN 1 AND 3 AND repeticao BETWEEN 1 AND tamanho_bloco / 3", name="ck_estudo_posicao"),
        CheckConstraint("bloco = 1 + (ordem - 1) / tamanho_bloco", name="ck_estudo_bloco_ordem"),
        CheckConstraint("tempo_alvo_ms IN (5000, 10000, 15000)", name="ck_estudo_tempo"),
        CheckConstraint("condicao IN ('SEM_ESTIMULO', 'LENTO', 'RAPIDO')", name="ck_estudo_condicao"),
        CheckConstraint("confianca IS NULL OR confianca BETWEEN 1 AND 7", name="ck_estudo_confianca"),
        CheckConstraint(
            "(resultado_ms IS NULL AND erro_ms IS NULL AND erro_absoluto_ms IS NULL AND erro_relativo_percentual IS NULL AND concluida_em IS NULL) OR "
            "(resultado_ms IS NOT NULL AND resultado_ms > 0 AND erro_ms IS NOT NULL AND erro_ms = round(resultado_ms - tempo_alvo_ms, 3) "
            "AND erro_absoluto_ms IS NOT NULL AND erro_absoluto_ms = abs(erro_ms) AND erro_relativo_percentual IS NOT NULL AND concluida_em IS NOT NULL)",
            name="ck_estudo_resultado_completo",
        ),
    )
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    sessao_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("sessoes_estudo.id", ondelete="CASCADE"), index=True)
    ordem: Mapped[int] = mapped_column(Integer, nullable=False)
    bloco: Mapped[int] = mapped_column(Integer, nullable=False)
    tamanho_bloco: Mapped[int] = mapped_column(Integer, nullable=False, default=3, server_default="3")
    repeticao: Mapped[int] = mapped_column(Integer, nullable=False)
    condicao: Mapped[str] = mapped_column(String(20), nullable=False)
    tempo_alvo_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    resultado_ms: Mapped[Decimal | None] = mapped_column(Numeric(18, 3))
    erro_ms: Mapped[Decimal | None] = mapped_column(Numeric(18, 3))
    erro_absoluto_ms: Mapped[Decimal | None] = mapped_column(Numeric(18, 3))
    erro_relativo_percentual: Mapped[Decimal | None] = mapped_column(Numeric(20, 6))
    concluida_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    confianca: Mapped[int | None] = mapped_column(Integer)
    respondida_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class RespostaBloco(Base):
    __tablename__ = "respostas_blocos_estudo"
    __table_args__ = (
        UniqueConstraint("sessao_id", "bloco", name="uq_resposta_bloco_estudo"),
        CheckConstraint("bloco BETWEEN 1 AND 3", name="ck_resposta_bloco_posicao"),
        CheckConstraint("agradabilidade IS NULL OR agradabilidade BETWEEN 1 AND 7", name="ck_resposta_agradabilidade"),
        CheckConstraint("ansiedade IS NULL OR ansiedade BETWEEN 1 AND 7", name="ck_resposta_ansiedade"),
    )
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    sessao_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("sessoes_estudo.id", ondelete="CASCADE"), nullable=False)
    bloco: Mapped[int] = mapped_column(Integer, nullable=False)
    agradabilidade: Mapped[int | None] = mapped_column(Integer)
    ansiedade: Mapped[int | None] = mapped_column(Integer)
    respondida_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

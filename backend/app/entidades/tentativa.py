import enum
import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.banco.base import Base

if TYPE_CHECKING:
    from app.entidades.participante import Participante


class Condicao(str, enum.Enum):
    SEM_ESTIMULO = "SEM_ESTIMULO"
    RAPIDO = "RAPIDO"
    LENTO = "LENTO"


class TipoTentativa(str, enum.Enum):
    OFICIAL = "OFICIAL"
    PERSONALIZADA = "PERSONALIZADA"


class Tentativa(Base):
    __tablename__ = "tentativas"
    __table_args__ = (
        Index(
            "uq_tentativa_oficial",
            "participante_id",
            "tempo_alvo_ms",
            "condicao",
            unique=True,
            postgresql_where=text("tipo_tentativa = 'OFICIAL'"),
        ),
        CheckConstraint(
            "(tipo_tentativa = 'OFICIAL' AND tempo_alvo_ms IN (5000, 15000, 30000)) OR (tipo_tentativa = 'PERSONALIZADA' AND tempo_alvo_ms > 0)",
            name="ck_tempo_alvo",
        ),
        CheckConstraint("resultado_ms > 0", name="ck_resultado_positivo"),
        CheckConstraint("erro_absoluto_ms >= 0", name="ck_erro_absoluto"),
        Index("ix_tentativas_condicao_tempo", "condicao", "tempo_alvo_ms"),
        Index("ix_tentativas_criado_em", "criado_em"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    participante_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("participantes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    tempo_personalizado_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("tempos_personalizados.id", ondelete="SET NULL"), nullable=True, index=True
    )
    tipo_tentativa: Mapped[TipoTentativa] = mapped_column(
        Enum(TipoTentativa, name="tipo_tentativa", native_enum=False),
        default=TipoTentativa.OFICIAL,
        server_default="OFICIAL",
        nullable=False,
    )
    tempo_alvo_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    condicao: Mapped[Condicao] = mapped_column(
        Enum(Condicao, name="condicao_tentativa", native_enum=False), nullable=False
    )
    resultado_ms: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False)
    erro_ms: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False)
    erro_absoluto_ms: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    participante: Mapped["Participante"] = relationship(back_populates="tentativas")
    tempo_personalizado = relationship("TempoPersonalizado")

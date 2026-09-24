import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.banco.base import Base

if TYPE_CHECKING:
    from app.entidades.participante import Participante


class TempoPersonalizado(Base):
    __tablename__ = "tempos_personalizados"
    __table_args__ = (
        Index(
            "uq_tempo_personalizado_ativo",
            "participante_id",
            "tempo_alvo_ms",
            unique=True,
            postgresql_where=text("ativo = true"),
        ),
        Index("ix_tempos_personalizados_criado_em", "criado_em"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    participante_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("participantes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    tempo_alvo_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    participante: Mapped["Participante"] = relationship(back_populates="tempos_personalizados")

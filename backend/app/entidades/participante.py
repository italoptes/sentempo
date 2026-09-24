import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Index, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.banco.base import Base

if TYPE_CHECKING:
    from app.entidades.tentativa import Tentativa
    from app.entidades.tempo_personalizado import TempoPersonalizado


class Participante(Base):
    __tablename__ = "participantes"
    __table_args__ = (
        UniqueConstraint("nome_normalizado", "codigo", name="uq_participante_nome_codigo"),
        Index("ix_participantes_nome_codigo", "nome_normalizado", "codigo"),
        Index("ix_participantes_criado_em", "criado_em"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    nome: Mapped[str] = mapped_column(String(120), nullable=False)
    nome_normalizado: Mapped[str] = mapped_column(String(120), nullable=False)
    codigo: Mapped[str] = mapped_column(String(4), nullable=False)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    tentativas: Mapped[list["Tentativa"]] = relationship(
        back_populates="participante", cascade="all, delete-orphan"
    )
    tempos_personalizados: Mapped[list["TempoPersonalizado"]] = relationship(
        back_populates="participante", cascade="all, delete-orphan"
    )

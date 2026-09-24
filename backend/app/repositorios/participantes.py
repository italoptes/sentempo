import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.entidades.participante import Participante


class RepositorioParticipantes:
    def __init__(self, sessao: Session):
        self.sessao = sessao

    def buscar_por_acesso(self, nome_normalizado: str, codigo: str) -> Participante | None:
        consulta = select(Participante).where(
            Participante.nome_normalizado == nome_normalizado,
            Participante.codigo == codigo,
        )
        return self.sessao.scalar(consulta)

    def buscar_por_id(self, participante_id: uuid.UUID) -> Participante | None:
        consulta = (
            select(Participante)
            .options(selectinload(Participante.tentativas))
            .where(Participante.id == participante_id)
        )
        return self.sessao.scalar(consulta)

    def criar(self, nome: str, nome_normalizado: str, codigo: str) -> Participante:
        participante = Participante(
            nome=nome, nome_normalizado=nome_normalizado, codigo=codigo
        )
        self.sessao.add(participante)
        self.sessao.flush()
        return participante

    def contar(self, busca: str | None = None) -> int:
        consulta = select(func.count(Participante.id))
        if busca:
            consulta = consulta.where(Participante.nome_normalizado.contains(busca.casefold()))
        return int(self.sessao.scalar(consulta) or 0)

    def listar(self, pagina: int, tamanho: int, busca: str | None = None) -> list[Participante]:
        consulta = select(Participante).options(selectinload(Participante.tentativas))
        if busca:
            consulta = consulta.where(Participante.nome_normalizado.contains(busca.casefold()))
        consulta = consulta.order_by(Participante.criado_em.desc()).offset(
            (pagina - 1) * tamanho
        ).limit(tamanho)
        return list(self.sessao.scalars(consulta).all())

    def excluir(self, participante_id: uuid.UUID) -> int:
        from sqlalchemy import delete
        comando = delete(Participante).where(Participante.id == participante_id)
        resultado = self.sessao.execute(comando)
        self.sessao.flush()
        return resultado.rowcount


from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.nucleo.configuracoes import obter_configuracoes


configuracoes = obter_configuracoes()
argumentos_conexao = (
    {"check_same_thread": False}
    if configuracoes.banco_url.startswith("sqlite")
    else {}
)
motor = create_engine(
    configuracoes.banco_url,
    pool_pre_ping=True,
    connect_args=argumentos_conexao,
)
FabricaSessao = sessionmaker(bind=motor, autoflush=False, expire_on_commit=False)


def obter_sessao() -> Generator[Session, None, None]:
    """Dependência FastAPI: abre sessão por requisição e garante fechamento no finally."""
    sessao = FabricaSessao()
    try:
        yield sessao
    finally:
        sessao.close()

"""
conftest.py — configuração dos testes do backend Sentempo.

Define variáveis de ambiente antes de importar qualquer módulo da aplicação,
de modo que as configurações sejam carregadas com SQLite em memória.
"""
import os

# Deve ser definido ANTES de qualquer importação da aplicação
os.environ["BANCO_URL"] = "sqlite://"
os.environ["CHAVE_SECRETA_JWT"] = "chave-secreta-de-testes-sentempo-completa-123456"
os.environ["NOME_ADMINISTRADOR"] = "pesquisador"
os.environ["CODIGO_ADMINISTRADOR"] = "1234"
os.environ["AMBIENTE"] = "desenvolvimento"

from collections.abc import Generator  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import StaticPool, create_engine  # noqa: E402
from sqlalchemy.orm import Session, sessionmaker  # noqa: E402

from app.banco.base import Base  # noqa: E402
from app.banco.conexao import obter_sessao  # noqa: E402
from app.principal import aplicacao  # noqa: E402


# Motor SQLite em memória compartilhado por conexão (StaticPool garante a mesma base
# entre diferentes conexões durante os testes, sem arquivo em disco)
_motor_testes = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
_FabricaSessaoTestes = sessionmaker(bind=_motor_testes, autoflush=False, expire_on_commit=False)


def _obter_sessao_testes() -> Generator[Session, None, None]:
    """Dependência de sessão para testes, usando motor SQLite em memória."""
    sessao = _FabricaSessaoTestes()
    try:
        yield sessao
    finally:
        sessao.close()


@pytest.fixture(autouse=True)
def banco_limpo():
    """Cria e destrói todas as tabelas antes e depois de cada teste."""
    Base.metadata.create_all(bind=_motor_testes)
    # Sobrescreve a dependência de sessão para usar o banco de testes
    aplicacao.dependency_overrides[obter_sessao] = _obter_sessao_testes
    yield
    aplicacao.dependency_overrides.clear()
    Base.metadata.drop_all(bind=_motor_testes)


@pytest.fixture
def cliente(banco_limpo) -> TestClient:  # noqa: ARG001
    return TestClient(aplicacao)


@pytest.fixture
def participante(cliente: TestClient) -> dict:
    resposta = cliente.post(
        "/api/participantes/acessar", json={"nome": "Ana Silva", "codigo": "0042"}
    )
    assert resposta.status_code == 201, resposta.text
    return resposta.json()


@pytest.fixture
def token_administrativo(cliente: TestClient) -> str:
    resposta = cliente.post(
        "/api/administracao/acessar",
        json={"nome": "Pesquisador", "codigo": "1234"},
    )
    assert resposta.status_code == 200, resposta.text
    return resposta.json()["token_acesso"]

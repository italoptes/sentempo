from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.banco.base import Base
from app.entidades import Participante, Tentativa
from app.nucleo.configuracoes import obter_configuracoes


configuracao_alembic = context.config
if configuracao_alembic.config_file_name is not None:
    fileConfig(configuracao_alembic.config_file_name)
configuracao_alembic.set_main_option("sqlalchemy.url", obter_configuracoes().banco_url)
metadados_alvo = Base.metadata


def executar_migracoes_offline() -> None:
    context.configure(
        url=configuracao_alembic.get_main_option("sqlalchemy.url"),
        target_metadata=metadados_alvo,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def executar_migracoes_online() -> None:
    conectavel = engine_from_config(
        configuracao_alembic.get_section(configuracao_alembic.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with conectavel.connect() as conexao:
        context.configure(connection=conexao, target_metadata=metadados_alvo)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    executar_migracoes_offline()
else:
    executar_migracoes_online()


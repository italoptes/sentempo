"""Integração em schema temporário do PostgreSQL, sem dados da aplicação."""
import os
import subprocess
import uuid

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url


@pytest.mark.skipif(not os.getenv("BANCO_TESTES_POSTGRES"), reason="Migrações exigem PostgreSQL isolado")
def test_migracao_preserva_dados_antigos_e_constraints():
    url = make_url(os.environ["BANCO_TESTES_POSTGRES"])
    motor = create_engine(url)
    esquema = "teste_migracao_" + uuid.uuid4().hex
    with motor.begin() as banco:
        banco.execute(text(f'CREATE SCHEMA "{esquema}"'))
    url_isolada = url.update_query_dict({"options": f"-csearch_path={esquema}"})
    ambiente = {**os.environ, "BANCO_URL": url_isolada.render_as_string(hide_password=False)}
    isolado = create_engine(url_isolada)
    try:
        subprocess.run(["alembic", "upgrade", "40ae90ed5e83"], env=ambiente, check=True, capture_output=True, text=True)
        pid, tid = uuid.uuid4(), uuid.uuid4()
        with isolado.begin() as banco:
            banco.execute(text("INSERT INTO participantes (id,nome,nome_normalizado,codigo) VALUES (:id,'Anterior','anterior','0042')"), {"id": pid})
            banco.execute(text("INSERT INTO tentativas (id,participante_id,tempo_alvo_ms,condicao,resultado_ms,erro_ms,erro_absoluto_ms) VALUES (:id,:pid,30000,'LENTO',31000,1000,1000)"), {"id": tid, "pid": pid})
        subprocess.run(["alembic", "upgrade", "head"], env=ambiente, check=True, capture_output=True, text=True)
        with isolado.connect() as banco:
            assert banco.execute(text("SELECT tempo_alvo_ms, resultado_ms FROM tentativas WHERE id=:id"), {"id": tid}).one() == (30000, 31000)
            assert banco.scalar(text("SELECT count(*) FROM sessoes_estudo")) == 0
            assert banco.scalar(text("SELECT proxima FROM distribuicoes_protocolos WHERE versao='ESTUDO_A_V1'")) == 0
            assert banco.scalar(text("SELECT count(*) FROM pg_indexes WHERE schemaname=:esquema AND indexname='uq_estudo_sessao_ordem'"), {"esquema": esquema}) == 1
    finally:
        isolado.dispose()
        with motor.begin() as banco:
            banco.execute(text(f'DROP SCHEMA "{esquema}" CASCADE'))
        motor.dispose()

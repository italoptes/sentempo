"""Integração em schema temporário do PostgreSQL, sem dados da aplicação."""
import os
import subprocess
import uuid

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session

from app.esquemas.estudo import ResultadoEstudo, SessaoCriacao
from app.servicos.estudo_servico import EstudoServico


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
        subprocess.run(["alembic", "upgrade", "0004_questionario_estudo"], env=ambiente, check=True, capture_output=True, text=True)
        sessao_antiga = uuid.uuid4()
        with isolado.begin() as banco:
            banco.execute(text("INSERT INTO sessoes_estudo (id,participante_id,versao_protocolo,sequencia,bloco_liberado,dispositivo,usa_fones,volume) "
                "VALUES (:id,:pid,'ESTUDO_A_V1',0,1,'COMPUTADOR',true,0.5)"), {"id": sessao_antiga, "pid": pid})
            for bloco, condicao in enumerate(("SEM_ESTIMULO", "LENTO", "RAPIDO"), 1):
                for posicao, (tempo, repeticao) in enumerate(((t, r) for t in (5000, 10000, 15000) for r in (1, 2, 3)), 1):
                    banco.execute(text("INSERT INTO tentativas_estudo (id,sessao_id,ordem,bloco,repeticao,condicao,tempo_alvo_ms) "
                        "VALUES (:id,:sid,:ordem,:bloco,:repeticao,:condicao,:tempo)"),
                        {"id": uuid.uuid4(), "sid": sessao_antiga, "ordem": (bloco - 1) * 9 + posicao,
                         "bloco": bloco, "repeticao": repeticao, "condicao": condicao, "tempo": tempo})
            banco.execute(text("UPDATE tentativas_estudo SET resultado_ms=5123.456,erro_ms=123.456,erro_absoluto_ms=123.456,"
                "erro_relativo_percentual=2.469120,concluida_em=now() WHERE sessao_id=:sid AND ordem=1"), {"sid": sessao_antiga})
            plano_antes = banco.execute(text("SELECT id,ordem,bloco,repeticao,resultado_ms FROM tentativas_estudo WHERE sessao_id=:sid ORDER BY ordem"), {"sid": sessao_antiga}).all()
        subprocess.run(["alembic", "upgrade", "head"], env=ambiente, check=True, capture_output=True, text=True)
        with isolado.connect() as banco:
            assert banco.execute(text("SELECT tempo_alvo_ms, resultado_ms FROM tentativas WHERE id=:id"), {"id": tid}).one() == (30000, 31000)
            assert banco.scalar(text("SELECT count(*) FROM sessoes_estudo")) == 1
            assert banco.scalar(text("SELECT proxima FROM distribuicoes_protocolos WHERE versao='ESTUDO_A_V1'")) == 0
            assert banco.scalar(text("SELECT proxima FROM distribuicoes_protocolos WHERE versao='ESTUDO_A_V2'")) == 0
            assert banco.execute(text("SELECT id,ordem,bloco,repeticao,resultado_ms FROM tentativas_estudo WHERE sessao_id=:sid ORDER BY ordem"), {"sid": sessao_antiga}).all() == plano_antes
            assert banco.scalar(text("SELECT count(*) FROM tentativas_estudo WHERE sessao_id=:sid AND tamanho_bloco=9"), {"sid": sessao_antiga}) == 27
            assert banco.scalar(text("SELECT count(*) FROM pg_indexes WHERE schemaname=:esquema AND indexname='uq_estudo_sessao_ordem'"), {"esquema": esquema}) == 1
        with Session(isolado) as banco:
            servico = EstudoServico(banco)
            s = servico.criar(pid, SessaoCriacao(consentimento=True, audio_testado=True, dispositivo="CELULAR", usa_fones=False, volume="0.5"))
            assert len(s.tentativas) == 9
            assert s.versao_protocolo == "ESTUDO_A_V2"
            assert sum(t.tempo_alvo_ms == 10000 for t in s.tentativas) == 3
            assert {t.tamanho_bloco for t in s.tentativas} == {3}
            servico.salvar(pid, s.tentativas[0].id, ResultadoEstudo(resultado_ms="5123.456"))
            assert servico.resposta(servico.obter(pid)).situacao == "QUESTIONARIO_TENTATIVA"
    finally:
        isolado.dispose()
        with motor.begin() as banco:
            banco.execute(text(f'DROP SCHEMA "{esquema}" CASCADE'))
        motor.dispose()

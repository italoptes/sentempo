from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal
import uuid

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.entidades.estudo import SessaoEstudo, TentativaEstudo
from app.esquemas.estudo import ResultadoEstudo, SessaoCriacao
from app.servicos.estudo_servico import ErroEstudo, EstudoServico
from testes.conftest import _FabricaSessaoTestes, _motor_testes

DADOS = {"consentimento": True, "audio_testado": True, "dispositivo": "COMPUTADOR", "usa_fones": True, "volume": "0.5"}


def endereco(participante):
    return f"/api/participantes/{participante['id']}/estudo-a"


def test_plano_persistido_composicao_e_retomada(cliente, participante):
    url = endereco(participante)
    sessao = cliente.post(url, json=DADOS).json()
    assert sessao["concluidas"] == 0
    assert sessao["total"] == 27
    assert len({t["id"] for t in sessao["tentativas"]}) == 27
    assert [t["ordem"] for t in sessao["tentativas"]] == list(range(1, 28))
    contagens = Counter((t["condicao"], t["tempo_alvo_ms"]) for t in sessao["tentativas"])
    assert len(contagens) == 9 and set(contagens.values()) == {3}
    for bloco in (1, 2, 3):
        itens = [t for t in sessao["tentativas"] if t["bloco"] == bloco]
        assert len({t["condicao"] for t in itens}) == 1
        assert Counter(t["tempo_alvo_ms"] for t in itens) == {5000: 3, 10000: 3, 15000: 3}
    assert cliente.get(url).json() == sessao
    assert cliente.post(url, json=DADOS).json() == sessao


def test_seis_ordens_balanceadas(cliente):
    sequencias = []
    ordens = set()
    for numero in range(13):
        p = cliente.post("/api/participantes/acessar", json={"nome": f"Pessoa {numero}", "codigo": "0042"}).json()
        s = cliente.post(endereco(p), json=DADOS).json()
        sequencias.append(s["sequencia"])
        ordens.add(tuple(s["ordem_condicoes"]))
    assert len(ordens) == 6
    contagens = Counter(sequencias)
    assert max(contagens.values()) - min(contagens.values()) <= 1


def test_fluxo_pausas_duplicidade_metricas_e_resultados_ocultos(cliente, participante):
    url = endereco(participante)
    s = cliente.post(url, json=DADOS).json()
    assert cliente.post(url + "/continuar").status_code == 409
    assert cliente.post(url + "/tentativas/" + s["tentativas"][1]["id"], json={"resultado_ms": 5000}).status_code == 409
    primeira = s["proxima"]
    for ordem in range(1, 28):
        atual = s["proxima"]
        resposta = cliente.post(url + "/tentativas/" + atual["id"], json={"resultado_ms": atual["tempo_alvo_ms"] + 123.456})
        assert resposta.status_code == 200, resposta.text
        s = resposta.json()
        assert s["concluidas"] == ordem
        if ordem < 27:
            assert all(t["resultado_ms"] is None for t in s["tentativas"])
        if ordem in (9, 18):
            assert s["situacao"] == "INTERVALO"
            assert cliente.get(url).json()["situacao"] == "INTERVALO"
            assert cliente.post(url + "/tentativas/" + s["proxima"]["id"], json={"resultado_ms": 5000}).status_code == 409
            s = cliente.post(url + "/continuar").json()
    assert s["situacao"] == "CONCLUIDA" and s["proxima"] is None
    assert cliente.post(url + "/continuar").status_code == 409
    assert cliente.post(url + "/tentativas/" + primeira["id"], json={"resultado_ms": 2000}).status_code == 409
    assert cliente.get(url).json() == s  # Recupera confirmação perdida sem repetir.
    for t in s["tentativas"]:
        assert t["erro_ms"] == pytest.approx(123.456)
        assert t["erro_absoluto_ms"] == pytest.approx(123.456)
        assert t["erro_relativo_percentual"] == pytest.approx(100 * 123.456 / t["tempo_alvo_ms"], abs=0.000001)
    assert cliente.get(f"/api/participantes/{participante['id']}").json()["progresso"]["concluidas"] == 0


@pytest.mark.parametrize("valor", [0, -1, "NaN", "Infinity", "-Infinity"])
def test_validacao_nao_avanca(cliente, participante, valor):
    url = endereco(participante)
    s = cliente.post(url, json=DADOS).json()
    assert cliente.post(url + "/tentativas/" + s["proxima"]["id"], json={"resultado_ms": valor}).status_code == 422
    assert cliente.get(url).json() == s


def test_consentimento_audio_e_isolamento(cliente, participante):
    url = endereco(participante)
    assert cliente.post(url, json={**DADOS, "consentimento": False}).status_code == 422
    assert cliente.post(url, json={**DADOS, "audio_testado": False}).status_code == 422
    s = cliente.post(url, json=DADOS).json()
    outro = cliente.post("/api/participantes/acessar", json={"nome": "Outra", "codigo": "0042"}).json()
    cliente.post(endereco(outro), json=DADOS)
    assert cliente.post(endereco(outro) + "/tentativas/" + s["proxima"]["id"], json={"resultado_ms": 5000}).status_code == 409


def test_banco_protege_posicao_e_resultado(cliente, participante):
    s = cliente.post(endereco(participante), json=DADOS).json()
    with _FabricaSessaoTestes() as banco:
        t = banco.get(TentativaEstudo, uuid.UUID(s["proxima"]["id"]))
        banco.add(TentativaEstudo(sessao_id=t.sessao_id, ordem=t.ordem, bloco=t.bloco,
            repeticao=t.repeticao, condicao=t.condicao, tempo_alvo_ms=t.tempo_alvo_ms))
        with pytest.raises(IntegrityError):
            banco.commit()
        banco.rollback()
        t.resultado_ms = Decimal("10")
        with pytest.raises(IntegrityError):
            banco.commit()


@pytest.mark.skipif(_motor_testes.dialect.name != "postgresql", reason="Locks concorrentes exigem PostgreSQL")
def test_criacao_e_salvamento_concorrentes(cliente, participante):
    pid = uuid.UUID(participante["id"])
    def criar(_):
        with _FabricaSessaoTestes() as banco:
            s = EstudoServico(banco).criar(pid, SessaoCriacao(**DADOS))
            return s.id
    with ThreadPoolExecutor(max_workers=6) as executor:
        ids = list(executor.map(criar, range(6)))
    assert len(set(ids)) == 1
    with _FabricaSessaoTestes() as banco:
        assert len(banco.scalars(select(SessaoEstudo)).all()) == 1
        t = EstudoServico(banco).obter(pid).tentativas[0].id
    def salvar(_):
        with _FabricaSessaoTestes() as banco:
            try:
                EstudoServico(banco).salvar(pid, t, ResultadoEstudo(resultado_ms=5000))
                return 200
            except ErroEstudo as erro:
                return erro.status
    with ThreadPoolExecutor(max_workers=6) as executor:
        respostas = list(executor.map(salvar, range(6)))
    assert Counter(respostas) == {200: 1, 409: 5}

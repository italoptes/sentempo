from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal
from datetime import datetime, timezone
import uuid

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.entidades.estudo import SessaoEstudo, TentativaEstudo
from app.esquemas.estudo import ResultadoEstudo, SessaoCriacao
from app.servicos.estudo_servico import ErroEstudo, EstudoServico
from testes.conftest import _FabricaSessaoTestes, _motor_testes

DADOS = {"consentimento": True, "audio_testado": True, "dispositivo": "COMPUTADOR", "usa_fones": True, "volume": "0.5"}


def criar_sessao_v1(participante_id):
    """Representa uma sessão já coletada no desenho anterior, sem usar a API V2."""
    with _FabricaSessaoTestes() as banco:
        s = SessaoEstudo(participante_id=uuid.UUID(participante_id), versao_protocolo="ESTUDO_A_V1",
            sequencia=0, bloco_liberado=1, dispositivo="COMPUTADOR", usa_fones=True, volume=Decimal("0.5"))
        for bloco, condicao in enumerate(("SEM_ESTIMULO", "LENTO", "RAPIDO"), 1):
            for posicao, (tempo, repeticao) in enumerate(((t, r) for t in (5000, 10000, 15000) for r in (1, 2, 3)), 1):
                s.tentativas.append(TentativaEstudo(ordem=(bloco - 1) * 9 + posicao, bloco=bloco,
                    tamanho_bloco=9, condicao=condicao, tempo_alvo_ms=tempo, repeticao=repeticao))
        primeira = s.tentativas[0]
        primeira.resultado_ms, primeira.erro_ms, primeira.erro_absoluto_ms = Decimal("5001"), Decimal("1"), Decimal("1")
        primeira.erro_relativo_percentual = Decimal("0.02")
        primeira.concluida_em = datetime.now(timezone.utc)
        banco.add(s)
        banco.commit()
        return s.id


def endereco(participante):
    return f"/api/participantes/{participante['id']}/estudo-a"


def test_plano_persistido_composicao_e_retomada(cliente, participante):
    url = endereco(participante)
    sessao = cliente.post(url, json=DADOS).json()
    assert sessao["concluidas"] == 0
    assert sessao["versao_protocolo"] == "ESTUDO_A_V2"
    assert sessao["total"] == 9
    assert len({t["id"] for t in sessao["tentativas"]}) == 9
    assert [t["ordem"] for t in sessao["tentativas"]] == list(range(1, 10))
    contagens = Counter((t["condicao"], t["tempo_alvo_ms"]) for t in sessao["tentativas"])
    assert len(contagens) == 9 and set(contagens.values()) == {1}
    assert {t["repeticao"] for t in sessao["tentativas"]} == {1}
    assert [b["total"] for b in sessao["blocos"]] == [3, 3, 3]
    for bloco in (1, 2, 3):
        itens = [t for t in sessao["tentativas"] if t["bloco"] == bloco]
        assert len({t["condicao"] for t in itens}) == 1
        assert Counter(t["tempo_alvo_ms"] for t in itens) == {5000: 1, 10000: 1, 15000: 1}
    assert cliente.get(url).json() == sessao
    assert cliente.post(url, json=DADOS).json() == sessao


def test_nova_sessao_nao_altera_o_plano_historico(cliente, participante):
    antiga_id = criar_sessao_v1(participante["id"])
    with _FabricaSessaoTestes() as banco:
        antiga = banco.get(SessaoEstudo, antiga_id)
        antes = [(t.id, t.ordem, t.bloco, t.repeticao, t.resultado_ms) for t in antiga.tentativas]
        assert EstudoServico.resposta(antiga).total == 27
        assert [b.total for b in EstudoServico.resposta(antiga).blocos] == [9, 9, 9]
    assert cliente.get(endereco(participante)).json() is None
    nova = cliente.post(endereco(participante), json=DADOS).json()
    assert nova["total"] == 9 and nova["id"] != str(antiga_id)
    with _FabricaSessaoTestes() as banco:
        antiga = banco.get(SessaoEstudo, antiga_id)
        assert [(t.id, t.ordem, t.bloco, t.repeticao, t.resultado_ms) for t in antiga.tentativas] == antes
        assert len(banco.scalars(select(SessaoEstudo)).all()) == 2


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
    for ordem in range(1, 10):
        atual = s["proxima"]
        resposta = cliente.post(url + "/tentativas/" + atual["id"], json={"resultado_ms": atual["tempo_alvo_ms"] + 123.456})
        assert resposta.status_code == 200, resposta.text
        s = resposta.json()
        assert s["concluidas"] == ordem
        assert all(t["resultado_ms"] is None for t in s["tentativas"])
        assert s["situacao"] == "QUESTIONARIO_TENTATIVA"
        assert cliente.get(url).json() == s
        s = cliente.post(url + "/questionario", json={"tipo": "TENTATIVA", "tentativa_id": atual["id"], "confianca": 5}).json()
        if ordem % 3 == 0:
            assert s["situacao"] == "QUESTIONARIO_BLOCO"
            s = cliente.post(url + "/questionario", json={"tipo": "BLOCO", "bloco": ordem // 3, "agradabilidade": 4, "ansiedade": None}).json()
        if ordem in (3, 6):
            assert s["situacao"] == "INTERVALO"
            assert cliente.get(url).json()["situacao"] == "INTERVALO"
            assert cliente.post(url + "/tentativas/" + s["proxima"]["id"], json={"resultado_ms": 5000}).status_code == 409
            s = cliente.post(url + "/continuar").json()
    assert s["situacao"] == "QUESTIONARIO_FINAL"
    assert s["concluidas"] == 9 and s["proxima"] is None
    assert [b["concluidas"] for b in s["blocos"]] == [3, 3, 3]
    s = cliente.post(url + "/questionario", json={"tipo": "FINAL", "estrategia": "SEM_CONTAGEM", "comentario": " Sem contagem "}).json()
    assert s["situacao"] == "CONCLUIDA" and s["proxima"] is None
    assert s["estrategia"] == "SEM_CONTAGEM" and s["comentario"] == "Sem contagem"
    assert cliente.post(url + "/continuar").status_code == 409
    assert cliente.post(url + "/tentativas/" + primeira["id"], json={"resultado_ms": 2000}).status_code == 409
    assert cliente.get(url).json() == s  # Recupera confirmação perdida sem repetir.
    for t in s["tentativas"]:
        assert t["erro_ms"] == pytest.approx(123.456)
        assert t["erro_absoluto_ms"] == pytest.approx(123.456)
        assert t["erro_relativo_percentual"] == pytest.approx(100 * 123.456 / t["tempo_alvo_ms"], abs=0.000001)
    assert cliente.get(f"/api/participantes/{participante['id']}").json()["progresso"]["concluidas"] == 0


def test_questionario_opcional_retomavel_e_sem_sobrescrita(cliente, participante):
    url = endereco(participante)
    s = cliente.post(url, json=DADOS).json()
    t = s["proxima"]
    s = cliente.post(url + "/tentativas/" + t["id"], json={"resultado_ms": 5000}).json()
    assert s["situacao"] == "QUESTIONARIO_TENTATIVA"
    assert cliente.get(url).json() == s
    assert cliente.post(url + "/tentativas/" + s["proxima"]["id"], json={"resultado_ms": 5000}).status_code == 409
    assert cliente.post(url + "/questionario", json={"tipo": "TENTATIVA", "tentativa_id": t["id"], "confianca": 8}).status_code == 422
    assert cliente.post(url + "/questionario", json={"tipo": "FINAL"}).status_code == 409
    resposta = {"tipo": "TENTATIVA", "tentativa_id": t["id"], "confianca": None}
    assert cliente.post(url + "/questionario", json=resposta).status_code == 200
    assert cliente.post(url + "/questionario", json={**resposta, "confianca": 3}).status_code == 409
    s = cliente.get(url).json()
    assert s["tentativas"][0]["questionario_respondido"] is True
    assert s["tentativas"][0]["confianca"] is None


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


def test_banco_rejeita_segunda_repeticao_na_nova_coleta(cliente, participante):
    s = cliente.post(endereco(participante), json=DADOS).json()
    with _FabricaSessaoTestes() as banco:
        t = banco.get(TentativaEstudo, uuid.UUID(s["proxima"]["id"]))
        t.repeticao = 2
        with pytest.raises(IntegrityError):
            banco.commit()


@pytest.mark.skipif(_motor_testes.dialect.name != "postgresql", reason="Locks concorrentes exigem PostgreSQL")
def test_balanceamento_concorrente_de_participantes_distintos(cliente):
    ids = [uuid.UUID(cliente.post("/api/participantes/acessar", json={"nome": f"Pessoa {i}", "codigo": "0042"}).json()["id"]) for i in range(12)]
    def criar(pid):
        with _FabricaSessaoTestes() as banco:
            return EstudoServico(banco).criar(pid, SessaoCriacao(**DADOS)).sequencia
    with ThreadPoolExecutor(max_workers=6) as executor:
        sequencias = list(executor.map(criar, ids))
    assert Counter(sequencias) == {i: 2 for i in range(6)}


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

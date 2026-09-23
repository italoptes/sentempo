import pytest


@pytest.mark.parametrize(
    ("resultado", "erro", "erro_absoluto"),
    [(5500, 500, 500), (4500, -500, 500), (5000, 0, 0)],
)
def test_calcula_erros_no_backend(cliente, participante, resultado, erro, erro_absoluto):
    resposta = cliente.post(
        f"/api/participantes/{participante['id']}/tentativas",
        json={"tempo_alvo_ms": 5000, "condicao": "SEM_ESTIMULO", "resultado_ms": resultado},
    )
    assert resposta.status_code == 201
    assert resposta.json()["erro_ms"] == erro
    assert resposta.json()["erro_absoluto_ms"] == erro_absoluto


def test_rejeita_tentativa_duplicada(cliente, participante):
    endereco = f"/api/participantes/{participante['id']}/tentativas"
    dados = {"tempo_alvo_ms": 15000, "condicao": "LENTO", "resultado_ms": 14000}
    assert cliente.post(endereco, json=dados).status_code == 201
    assert cliente.post(endereco, json=dados).status_code == 409


@pytest.mark.parametrize("resultado", [0, -1, "NaN", "Infinity"])
def test_rejeita_resultado_invalido(cliente, participante, resultado):
    resposta = cliente.post(
        f"/api/participantes/{participante['id']}/tentativas",
        json={"tempo_alvo_ms": 5000, "condicao": "RAPIDO", "resultado_ms": resultado},
    )
    assert resposta.status_code == 422


@pytest.mark.parametrize("tempo", [1, 10000, 50000])
def test_rejeita_tempo_invalido(cliente, participante, tempo):
    resposta = cliente.post(
        f"/api/participantes/{participante['id']}/tentativas",
        json={"tempo_alvo_ms": tempo, "condicao": "RAPIDO", "resultado_ms": 5000},
    )
    assert resposta.status_code == 422


def test_rejeita_condicao_invalida(cliente, participante):
    resposta = cliente.post(
        f"/api/participantes/{participante['id']}/tentativas",
        json={"tempo_alvo_ms": 5000, "condicao": "OUTRA", "resultado_ms": 5000},
    )
    assert resposta.status_code == 422


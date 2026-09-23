import pytest


def test_cria_e_recupera_participante_sem_diferenciar_maiusculas(cliente):
    primeira = cliente.post(
        "/api/participantes/acessar", json={"nome": "  Ana   Silva ", "codigo": "0042"}
    )
    segunda = cliente.post(
        "/api/participantes/acessar", json={"nome": "ana silva", "codigo": "0042"}
    )
    assert primeira.status_code == 201
    assert segunda.status_code == 200
    assert primeira.json()["id"] == segunda.json()["id"]
    assert primeira.json()["codigo"] == "0042"


def test_nome_igual_com_codigo_diferente_cria_perfis_distintos(cliente):
    primeiro = cliente.post(
        "/api/participantes/acessar", json={"nome": "Ana", "codigo": "0001"}
    ).json()
    segundo = cliente.post(
        "/api/participantes/acessar", json={"nome": "Ana", "codigo": "0002"}
    ).json()
    assert primeiro["id"] != segundo["id"]


@pytest.mark.parametrize("codigo", ["123", "12345", "12a4", "", " 123"])
def test_rejeita_codigo_invalido(cliente, codigo):
    resposta = cliente.post(
        "/api/participantes/acessar", json={"nome": "Ana", "codigo": codigo}
    )
    assert resposta.status_code == 422


def test_detalhe_contem_nove_combinacoes(cliente, participante):
    resposta = cliente.get(f"/api/participantes/{participante['id']}")
    assert resposta.status_code == 200
    assert len(resposta.json()["combinacoes"]) == 9


import jwt


def autorizacao(token):
    return {"Authorization": f"Bearer {token}"}


def test_login_administrativo(cliente):
    valido = cliente.post(
        "/api/administracao/acessar", json={"nome": "PESQUISADOR", "codigo": "1234"}
    )
    invalido = cliente.post(
        "/api/administracao/acessar", json={"nome": "pesquisador", "codigo": "0000"}
    )
    assert valido.status_code == 200
    assert valido.json()["tipo_token"] == "bearer"
    assert invalido.status_code == 401


def test_token_expirado_e_rejeitado(cliente):
    token = jwt.encode(
        {"sub": "administracao", "exp": 1},
        "chave-secreta-de-testes-sentempo-completa",
        algorithm="HS256",
    )
    resposta = cliente.get("/api/administracao/resumo", headers=autorizacao(token))
    assert resposta.status_code == 401


def test_estatisticas_por_condicao_e_tempo(cliente, participante, token_administrativo):
    endereco = f"/api/participantes/{participante['id']}/tentativas"
    cliente.post(
        endereco,
        json={"tempo_alvo_ms": 5000, "condicao": "RAPIDO", "resultado_ms": 4500},
    )
    cliente.post(
        endereco,
        json={"tempo_alvo_ms": 15000, "condicao": "LENTO", "resultado_ms": 16000},
    )
    cabecalho = autorizacao(token_administrativo)
    condicoes = cliente.get(
        "/api/administracao/estatisticas?agrupar_por=condicao", headers=cabecalho
    ).json()
    tempos = cliente.get(
        "/api/administracao/estatisticas?agrupar_por=tempo", headers=cabecalho
    ).json()
    rapido = next(item for item in condicoes["itens"] if item["chave"] == "RAPIDO")
    cinco = next(item for item in tempos["itens"] if item["chave"] == "5000")
    assert rapido["erro_medio_ms"] == -500
    assert rapido["tendencia_predominante"] == "ABAIXO"
    assert cinco["quantidade_tentativas"] == 1


def test_csv_tem_bom_cabecalho_e_dados(cliente, participante, token_administrativo):
    cliente.post(
        f"/api/participantes/{participante['id']}/tentativas",
        json={"tempo_alvo_ms": 30000, "condicao": "SEM_ESTIMULO", "resultado_ms": 31000},
    )
    resposta = cliente.get(
        "/api/administracao/exportacao.csv", headers=autorizacao(token_administrativo)
    )
    assert resposta.status_code == 200
    assert resposta.content.startswith(b"\xef\xbb\xbf")
    assert "participante_id;nome;codigo;tempo_alvo_ms" in resposta.text
    assert ";Ana Silva;0042;30000;SEM_ESTIMULO;" in resposta.text


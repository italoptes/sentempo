def test_exclusoes_exigem_administrador_e_conferem_proprietario(cliente, participante, token_administrativo):
    url = f"/api/participantes/{participante['id']}/tentativas"
    t = cliente.post(url, json={"tempo_alvo_ms": 5000, "condicao": "LENTO", "resultado_ms": 5000}).json()
    assert cliente.delete(url).status_code in (401, 403)
    assert cliente.delete(url + "/" + t["id"]).status_code in (401, 403)
    outra = cliente.post("/api/participantes/acessar", json={"nome": "Outra", "codigo": "0042"}).json()
    cabecalho = {"Authorization": f"Bearer {token_administrativo}"}
    assert cliente.delete(f"/api/participantes/{outra['id']}/tentativas/{t['id']}", headers=cabecalho).status_code == 404
    assert len(cliente.get(f"/api/participantes/{participante['id']}").json()["tentativas"]) == 1
    assert cliente.delete(url + "/" + t["id"], headers=cabecalho).status_code == 204

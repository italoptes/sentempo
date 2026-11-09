import csv
import io

from testes.teste_estudo import DADOS, criar_sessao_v1, endereco


def test_relatorios_e_exportacoes_separam_protocolos(cliente, participante, token_administrativo):
    antiga_id = criar_sessao_v1(participante["id"])
    url_antigo = f"/api/participantes/{participante['id']}/tentativas"
    for tempo in (15000, 30000):
        assert cliente.post(url_antigo, json={"tempo_alvo_ms": tempo, "condicao": "LENTO", "resultado_ms": tempo}).status_code == 201
    tempo_livre = cliente.post(f"/api/participantes/{participante['id']}/tempos-personalizados", json={"tempo_alvo_ms": 7000}).json()
    assert cliente.post(url_antigo, json={"tempo_alvo_ms": 7000, "condicao": "RAPIDO", "resultado_ms": 8000,
        "tipo_tentativa": "PERSONALIZADA", "tempo_personalizado_id": tempo_livre["id"]}).status_code == 201
    s = cliente.post(endereco(participante), json=DADOS).json()
    t = s["proxima"]
    assert cliente.post(endereco(participante) + "/tentativas/" + t["id"], json={"resultado_ms": t["tempo_alvo_ms"] - 100}).status_code == 200
    cliente.post(endereco(participante) + "/questionario", json={"tipo": "TENTATIVA", "tentativa_id": t["id"], "confianca": 6})
    cabecalho = {"Authorization": f"Bearer {token_administrativo}"}
    assert cliente.get("/api/administracao/estudo-a").status_code in (401, 403)
    painel = cliente.get("/api/administracao/estudo-a", headers=cabecalho).json()
    assert painel["sessoes_total"] == 1 and painel["tentativas_concluidas"] == 1
    assert painel["versao_protocolo"] == "ESTUDO_A_V2"
    assert painel["sessoes"][0]["total"] == 9
    assert painel["estatisticas"][0]["erro_medio_ms"] == -100
    assert painel["sessoes"][0]["tentativas"][0]["resultado_ms"] == t["tempo_alvo_ms"] - 100
    assert cliente.get("/api/administracao/resumo", headers=cabecalho).json()["tentativas_validas_total"] == 2
    for origem, quantidade in (("ANTERIOR", 2), ("LIVRE", 1), ("ESTUDO_A", 1)):
        resposta = cliente.get(f"/api/administracao/exportacao.csv?origem={origem}", headers=cabecalho)
        assert resposta.status_code == 200
        assert "Ana Silva" not in resposta.text
        linhas = list(csv.DictReader(io.StringIO(resposta.text.lstrip("\ufeff")), delimiter=";"))
        assert len(linhas) == quantidade
        assert {l["origem"] for l in linhas} == {origem}
        assert {l["codigo_participante"] for l in linhas} == {participante["id"]}
        if origem == "ESTUDO_A":
            linha = linhas[0]
            assert linha["sessao_id"] == s["id"] and linha["ordem"] == "1"
            assert linha["confianca"] == "6" and linha["confianca_respondida_em"]
            assert linha["dispositivo"] == "COMPUTADOR" and linha["sessao_concluida_em"] == ""
    assert cliente.get("/api/administracao/exportacao.csv?origem=TODOS", headers=cabecalho).status_code == 422
    anterior = cliente.get("/api/administracao/estudo-a?versao=ESTUDO_A_V1", headers=cabecalho).json()
    assert anterior["sessoes_total"] == 1 and anterior["tentativas_concluidas"] == 1
    assert anterior["estatisticas"][0]["erro_medio_ms"] == 1
    assert anterior["sessoes"][0]["id"] == str(antiga_id)
    assert anterior["sessoes"][0]["total"] == 27
    antigo_csv = cliente.get("/api/administracao/exportacao.csv?origem=ESTUDO_A&versao=ESTUDO_A_V1", headers=cabecalho)
    linhas = list(csv.DictReader(io.StringIO(antigo_csv.text.lstrip("\ufeff")), delimiter=";"))
    assert len(linhas) == 1 and linhas[0]["versao_protocolo"] == "ESTUDO_A_V1"
    assert linhas[0]["sessao_id"] == str(antiga_id)
    assert cliente.get("/api/administracao/estudo-a?versao=INVALIDA", headers=cabecalho).status_code == 422

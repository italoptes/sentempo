import csv
import io
import uuid

from app.entidades.tempo_personalizado import TempoPersonalizado
from app.entidades.tentativa import Tentativa, TipoTentativa
from testes.conftest import _FabricaSessaoTestes

from testes.teste_estudo import DADOS, criar_sessao_v1, endereco


def test_relatorios_e_exportacoes_separam_protocolos(cliente, participante, token_administrativo):
    antiga_id = criar_sessao_v1(participante["id"])
    url_antigo = f"/api/participantes/{participante['id']}/tentativas"
    for tempo in (15000, 30000):
        assert cliente.post(url_antigo, json={"tempo_alvo_ms": tempo, "condicao": "LENTO", "resultado_ms": tempo}).status_code == 201
    # Dados históricos do modo livre, anteriores à exigência de concluir o estudo.
    with _FabricaSessaoTestes() as banco:
        tempo_livre = TempoPersonalizado(participante_id=uuid.UUID(participante["id"]), tempo_alvo_ms=7000)
        banco.add(tempo_livre)
        banco.flush()
        banco.add(Tentativa(participante_id=uuid.UUID(participante["id"]), tempo_alvo_ms=7000,
            condicao="RAPIDO", resultado_ms=8000, erro_ms=1000, erro_absoluto_ms=1000,
            tipo_tentativa=TipoTentativa.PERSONALIZADA, tempo_personalizado_id=tempo_livre.id))
        banco.commit()
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
    assert cliente.get("/api/administracao/modo-livre").status_code in (401, 403)
    livre = cliente.get("/api/administracao/modo-livre?tamanho=1", headers=cabecalho).json()
    assert livre["tentativas_total"] == 3
    assert livre["participantes_total"] == 1 and livre["tempos_total"] == 3
    assert livre["total_paginas"] == 3 and livre["pagina"] == 1
    assert livre["estatisticas"] == [{"condicao": "RAPIDO", "tempo_alvo_ms": 7000,
        "quantidade": 1, "erro_medio_ms": 1000, "erro_absoluto_medio_ms": 1000},
        {"condicao": "LENTO", "tempo_alvo_ms": 15000, "quantidade": 1, "erro_medio_ms": 0, "erro_absoluto_medio_ms": 0},
        {"condicao": "LENTO", "tempo_alvo_ms": 30000, "quantidade": 1, "erro_medio_ms": 0, "erro_absoluto_medio_ms": 0}]
    assert livre["tentativas"][0]["participante_id"] == participante["id"]
    paginas = [cliente.get(f"/api/administracao/modo-livre?pagina={n}&tamanho=1", headers=cabecalho).json() for n in (1, 2, 3)]
    jogos = [p["tentativas"][0] for p in paginas]
    assert {j["tempo_alvo_ms"] for j in jogos} == {7000, 15000, 30000}
    assert len({j["id"] for j in jogos}) == 3
    assert next(j for j in jogos if j["tempo_alvo_ms"] == 7000)["resultado_ms"] == 8000
    assert cliente.get("/api/administracao/modo-livre?pagina=4&tamanho=1", headers=cabecalho).json()["tentativas"] == []
    assert cliente.get("/api/administracao/modo-livre?pagina=0", headers=cabecalho).status_code == 422
    assert cliente.get("/api/administracao/resumo", headers=cabecalho).json()["tentativas_validas_total"] == 2
    for origem, quantidade in (("ANTERIOR", 2), ("LIVRE", 3), ("ESTUDO_A", 1)):
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


def test_painel_livre_vazio(cliente, token_administrativo):
    resposta = cliente.get("/api/administracao/modo-livre", headers={"Authorization": f"Bearer {token_administrativo}"})
    assert resposta.status_code == 200
    assert resposta.json() == {"participantes_total": 0, "tentativas_total": 0, "tempos_total": 0,
        "pagina": 1, "total_paginas": 0, "estatisticas": [], "tentativas": []}

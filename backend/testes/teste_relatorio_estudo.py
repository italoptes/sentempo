import csv
import io
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from app.entidades.estudo import SessaoEstudo, TentativaEstudo
from app.entidades.participante import Participante
from app.entidades.tempo_personalizado import TempoPersonalizado
from app.entidades.tentativa import Tentativa, TipoTentativa
from app.servicos.relatorio_estudo_servico import RelatorioEstudoServico
from testes.conftest import _FabricaSessaoTestes

from testes.teste_estudo import DADOS, criar_sessao_v1, endereco


def _criar_sessao_analitica(participante_id: str, erros: dict[tuple[str, int], int], concluida: bool = True) -> None:
    with _FabricaSessaoTestes() as banco:
        sessao = SessaoEstudo(
            participante_id=uuid.UUID(participante_id),
            versao_protocolo="ESTUDO_A_V2",
            sequencia=0,
            bloco_liberado=3,
            dispositivo="COMPUTADOR",
            usa_fones=True,
            volume=Decimal("0.5"),
            concluida_em=datetime.now(timezone.utc) if concluida else None,
        )
        for bloco, condicao in enumerate(("SEM_ESTIMULO", "LENTO", "RAPIDO"), 1):
            for posicao, tempo in enumerate((5000, 10000, 15000), 1):
                erro = Decimal(erros.get((condicao, tempo), 0))
                sessao.tentativas.append(TentativaEstudo(
                    ordem=(bloco - 1) * 3 + posicao,
                    bloco=bloco,
                    tamanho_bloco=3,
                    repeticao=1,
                    condicao=condicao,
                    tempo_alvo_ms=tempo,
                    resultado_ms=Decimal(tempo) + erro,
                    erro_ms=erro,
                    erro_absoluto_ms=abs(erro),
                    erro_relativo_percentual=Decimal(100) * erro / Decimal(tempo),
                    concluida_em=datetime.now(timezone.utc),
                ))
        banco.add(sessao)
        banco.commit()


def _criar_participantes_analise() -> list[str]:
    with _FabricaSessaoTestes() as banco:
        participantes = [
            Participante(nome=nome, nome_normalizado=nome.casefold(), codigo=codigo)
            for nome, codigo in (("Pessoa Um", "0001"), ("Pessoa Dois", "0002"), ("Pendente", "0003"))
        ]
        banco.add_all(participantes)
        banco.commit()
        return [str(participante.id) for participante in participantes]


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
    assert painel["sessoes"][0]["nome_participante"] == "Ana Silva"
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


def test_analise_v2_usa_sessoes_concluidas_e_pareia_por_participante():
    participantes = _criar_participantes_analise()
    _criar_sessao_analitica(participantes[0], {
        ("SEM_ESTIMULO", 10000): -600,
        ("RAPIDO", 10000): -1200,
    })
    _criar_sessao_analitica(participantes[1], {
        ("SEM_ESTIMULO", 10000): 600,
        ("RAPIDO", 10000): 1200,
    })
    # O resultado extremo desta sessão aparece no acompanhamento, mas não na amostra principal.
    _criar_sessao_analitica(participantes[2], {
        ("SEM_ESTIMULO", 10000): 4000,
        ("RAPIDO", 10000): 4000,
    }, concluida=False)

    with _FabricaSessaoTestes() as banco:
        painel = RelatorioEstudoServico(banco).painel(pagina=1, tamanho=1)
    analise = painel["analise"]
    assert painel["sessoes_total"] == 3
    assert painel["sessoes_completas"] == 2
    assert analise["criterio_inclusao"] == "SESSOES_CONCLUIDAS"
    assert analise["participantes"] == 2
    assert len(analise["resultados"]) == 9

    silencio = next(
        item for item in analise["resultados"]
        if item["condicao"] == "SEM_ESTIMULO" and item["tempo_alvo_ms"] == 10000
    )
    assert silencio["participantes"] == 2
    assert silencio["erro_assinado_medio_ms"] == 0
    assert silencio["erro_absoluto_medio_ms"] == 600
    assert silencio["erro_relativo_medio_percentual"] == 0

    rapido = next(
        item for item in analise["comparacoes"]
        if item["condicao"] == "RAPIDO" and item["tempo_alvo_ms"] == 10000
    )
    assert rapido["pares"] == 2
    assert rapido["diferenca_erro_assinado_media_ms"] == 0
    assert rapido["diferenca_erro_absoluto_media_ms"] == 600
    assert rapido["diferenca_erro_relativo_media_pp"] == 0
    assert (rapido["mais_cedo"], rapido["mais_tarde"], rapido["mesmo_tempo"]) == (1, 1, 0)

    with _FabricaSessaoTestes() as banco:
        outra_pagina = RelatorioEstudoServico(banco).painel(pagina=2, tamanho=1)
    assert outra_pagina["analise"] == analise


def test_analise_v2_explicita_celulas_e_pares_ausentes():
    with _FabricaSessaoTestes() as banco:
        analise = RelatorioEstudoServico(banco).painel(pagina=1, tamanho=10)["analise"]
    assert analise["participantes"] == 0
    assert len(analise["resultados"]) == 9
    assert all(item["participantes"] == 0 for item in analise["resultados"])
    assert all(item["erro_assinado_medio_ms"] is None for item in analise["resultados"])
    assert len(analise["comparacoes"]) == 6
    assert all(item["pares"] == 0 for item in analise["comparacoes"])

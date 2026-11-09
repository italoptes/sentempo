import uuid
from datetime import datetime, timezone

from app.entidades.estudo import SessaoEstudo
from app.entidades.tempo_personalizado import TempoPersonalizado
from testes.conftest import _FabricaSessaoTestes
from testes.teste_estudo import DADOS, criar_sessao_v1, endereco


def test_protocolo_anterior_nao_desbloqueia_jogo(cliente, participante):
    base = f"/api/participantes/{participante['id']}"
    assert cliente.get(base + "/modo-livre").json() == {"desbloqueado": False, "tempos": []}
    for tempo in (15000, 30000):
        assert cliente.post(base + "/tentativas", json={"tempo_alvo_ms": tempo, "condicao": "LENTO", "resultado_ms": tempo}).status_code == 201
    assert cliente.get(base + "/modo-livre").json()["desbloqueado"] is False
    assert cliente.post(base + "/tempos-personalizados", json={"tempo_alvo_ms": 7000}).status_code == 403


def test_desbloqueia_apenas_apos_encerramento_da_pesquisa(cliente, participante):
    base = f"/api/participantes/{participante['id']}"
    url = endereco(participante)
    s = cliente.post(url, json=DADOS).json()
    while s["situacao"] != "QUESTIONARIO_FINAL":
        assert cliente.get(base + "/modo-livre").json()["desbloqueado"] is False
        if s["situacao"] == "QUESTIONARIO_TENTATIVA":
            s = cliente.post(url + "/questionario", json={"tipo": "TENTATIVA", "tentativa_id": s["questionario_pendente"]["tentativa_id"], "confianca": None}).json()
        elif s["situacao"] == "QUESTIONARIO_BLOCO":
            s = cliente.post(url + "/questionario", json={"tipo": "BLOCO", "bloco": s["questionario_pendente"]["bloco"], "agradabilidade": None, "ansiedade": None}).json()
        elif s["situacao"] == "INTERVALO":
            s = cliente.post(url + "/continuar").json()
        else:
            t = s["proxima"]
            s = cliente.post(url + "/tentativas/" + t["id"], json={"resultado_ms": t["tempo_alvo_ms"]}).json()
    assert s["concluidas"] == 9
    assert cliente.get(base + "/modo-livre").json()["desbloqueado"] is False
    assert cliente.post(base + "/tempos-personalizados", json={"tempo_alvo_ms": 7000}).status_code == 403
    # A escolha de não responder continua válida: o encerramento libera o jogo.
    final = cliente.post(url + "/questionario", json={"tipo": "FINAL", "estrategia": None}).json()
    assert final["situacao"] == "CONCLUIDA"
    assert cliente.get(base + "/modo-livre").json()["desbloqueado"] is True
    tempo = cliente.post(base + "/tempos-personalizados", json={"tempo_alvo_ms": 7000})
    assert tempo.status_code == 201
    assert len(cliente.get(base + "/modo-livre").json()["tempos"]) == 1
    assert cliente.post(base + "/tentativas", json={"tempo_alvo_ms": 7000, "resultado_ms": 7100, "condicao": "LENTO", "tipo_tentativa": "PERSONALIZADA", "tempo_personalizado_id": tempo.json()["id"]}).status_code == 201
    # Os desafios clássicos também são partidas livres, repetíveis, inclusive o alvo de 10 s.
    for alvo in (5000, 10000, 15000):
        classico = cliente.post(base + "/tempos-personalizados", json={"tempo_alvo_ms": alvo})
        assert classico.status_code == 201
        for _ in range(2):
            assert cliente.post(base + "/tentativas", json={"tempo_alvo_ms": alvo,
                "resultado_ms": alvo + 100, "condicao": "RAPIDO", "tipo_tentativa": "PERSONALIZADA",
                "tempo_personalizado_id": classico.json()["id"]}).status_code == 201
    assert cliente.get(url).json() == final
    perfil = cliente.get(base).json()
    assert perfil["progresso"]["concluidas"] == 0
    assert len(perfil["tentativas_livres"]) == 7
    outro = cliente.post('/api/participantes/acessar', json={"nome": "Outro jogador", "codigo": "1234"}).json()
    assert cliente.get(f"/api/participantes/{outro['id']}/modo-livre").json()["desbloqueado"] is False


def test_tempo_antigo_nao_permite_jogar_sem_concluir_estudo_atual(cliente, participante):
    base = f"/api/participantes/{participante['id']}"
    antiga_id = criar_sessao_v1(participante["id"])
    with _FabricaSessaoTestes() as banco:
        # Representa uma coleta histórica já encerrada e um tempo antigo salvo.
        banco.get(SessaoEstudo, antiga_id).concluida_em = datetime.now(timezone.utc)
        tempo = TempoPersonalizado(participante_id=uuid.UUID(participante["id"]), tempo_alvo_ms=7000)
        banco.add(tempo)
        banco.commit()
        tempo_id = str(tempo.id)
    assert cliente.get(base + "/modo-livre").json() == {"desbloqueado": False, "tempos": []}
    resposta = cliente.post(base + "/tentativas", json={"tempo_alvo_ms": 7000, "resultado_ms": 7100, "condicao": "LENTO", "tipo_tentativa": "PERSONALIZADA", "tempo_personalizado_id": tempo_id})
    assert resposta.status_code == 403
    assert cliente.get(base).json()["tentativas_livres"] == []

"""Carga de demonstração do Estudo A. Executar com o banco já migrado."""
from random import Random

from sqlalchemy.orm import Session

from app.banco.conexao import motor
from app.esquemas.estudo import RespostaQuestionario, ResultadoEstudo, SessaoCriacao
from app.servicos.estudo_servico import EstudoServico
from app.servicos.participante_servico import ParticipanteServico


def povoar(banco, numero):
    pessoa, criada = ParticipanteServico(banco).acessar(
        f"Demo Estudo {numero:02}", str(7000 + numero)
    )
    if not criada:
        return False

    sorteio = Random(numero)
    estudo = EstudoServico(banco)
    sessao = estudo.criar(pessoa.id, SessaoCriacao(
        consentimento=True, audio_testado=True,
        dispositivo=sorteio.choice(["COMPUTADOR", "CELULAR", "TABLET"]),
        usa_fones=sorteio.choice([True, False]), volume=0.6,
    ))
    for tentativa in sessao.tentativas:
        if tentativa.ordem == 4 or tentativa.ordem == 7:
            estudo.continuar(pessoa.id)
        desvio = sorteio.randint(-1300, 1500)
        estudo.salvar(pessoa.id, tentativa.id, ResultadoEstudo(
            resultado_ms=tentativa.tempo_alvo_ms + desvio
        ))
        if numero == 19 and tentativa.ordem == 4:
            return True
        estudo.responder(pessoa.id, RespostaQuestionario(
            tipo="TENTATIVA", tentativa_id=tentativa.id,
            confianca=sorteio.choice([None, 2, 3, 4, 5, 6, 7]),
        ))
        if tentativa.ordem % 3 == 0:
            estudo.responder(pessoa.id, RespostaQuestionario(
                tipo="BLOCO", bloco=tentativa.bloco,
                agradabilidade=sorteio.randint(1, 7), ansiedade=sorteio.randint(1, 7),
            ))
    if numero != 20:
        estudo.responder(pessoa.id, RespostaQuestionario(
            tipo="FINAL", estrategia=sorteio.choice([
                "SEM_CONTAGEM", "CONTAGEM_MENTAL", "CONTAGEM_BIPES", "COMBINADA", None,
            ]),
        ))
    return True


if __name__ == "__main__":
    criados = 0
    for numero in range(1, 21):
        # Os serviços fazem commits próprios. A transação externa mantém cada
        # participante e sua sessão atômicos mesmo em caso de interrupção.
        with motor.begin() as conexao, Session(
            bind=conexao, join_transaction_mode="rollback_only", expire_on_commit=False
        ) as banco:
            criados += povoar(banco, numero)
    print(f"Participantes de demonstração criados: {criados}; já existentes: {20 - criados}.")

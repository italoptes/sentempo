// utilitarios/estimulo.ts — Lógica do estímulo audiovisual (Tone.js)
// Primeiro pulso imediato, conforme especificado no README.

import * as Tone from 'tone';

export type Condicao = 'SEM_ESTIMULO' | 'RAPIDO' | 'LENTO';

/** Gera inteiro aleatório inclusivo em [min, max] */
function aleatorio(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Intervalo em ms para próximo pulso conforme condição */
function proximoIntervalo(condicao: Condicao): number {
  if (condicao === 'RAPIDO') return aleatorio(300, 700);
  if (condicao === 'LENTO') return aleatorio(900, 1600);
  return 0; // SEM_ESTIMULO nunca chega aqui
}

export interface ControleEstimulo {
  iniciar: () => void;
  /** Para e limpa todos os agendamentos e recursos de áudio */
  parar: () => void;
}

/**
 * Prepara o áudio sem disparar pulsos; iniciar() ativa o estímulo.
 *
 * @param condicao - 'RAPIDO' | 'LENTO'
 * @param aoDisparar - callback disparado a cada pulso (inclui o primeiro imediato)
 * @param aoErro - callback caso o áudio falhe durante a rodada
 * @returns controle com métodos iniciar() e parar()
 */
export async function prepararEstimulo(
  condicao: Condicao,
  aoDisparar: () => void,
  aoErro: (motivo: string) => void,
): Promise<ControleEstimulo> {
  if (condicao === 'SEM_ESTIMULO') {
    return { iniciar: () => undefined, parar: () => undefined };
  }

  // Inicializa contexto de áudio a partir do gesto do usuário
  await Tone.start();

  let ativo = false;
  let encerrado = false;
  const agendamentos: ReturnType<typeof setTimeout>[] = [];

  // Sintetizador simples: oscilador com envelope curto, ajustado para ser mais audível e nítido
  const sintetizador = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.0, release: 0.1 },
    volume: -8, // Volume mais alto para garantir clareza
  }).toDestination();

  function disparar() {
    if (!ativo) return;
    try {
      // Dispara som (E5 é mais agudo e perceptível) e animação pelo mesmo evento
      sintetizador.triggerAttackRelease('E5', '16n');
      aoDisparar();
    } catch (erro) {
      parar();
      aoErro(erro instanceof Error ? erro.message : 'Erro de áudio');
      return;
    }

    // Agenda próximo pulso
    const id = setTimeout(() => {
      if (ativo) disparar();
    }, proximoIntervalo(condicao));
    agendamentos.push(id);
  }

  function parar() {
    if (encerrado) return;
    encerrado = true;
    ativo = false;
    agendamentos.forEach(clearTimeout);
    agendamentos.length = 0;
    try { sintetizador.dispose(); } catch { /* ignora */ }
  }

  function iniciar() {
    if (ativo || encerrado) return;
    ativo = true;
    disparar();
  }

  return { iniciar, parar };
}

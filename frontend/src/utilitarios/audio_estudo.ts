import * as Tone from 'tone';
import type { CondicaoEstudo } from '../servicos/estudo';
import { criarRitmoFixo } from './ritmo_fixo';

export interface AudioEstudo { iniciar: () => void; parar: () => void }

export async function prepararAudioEstudo(condicao: CondicaoEstudo, volume: number, aoErro: () => void): Promise<AudioEstudo> {
  if (condicao === 'SEM_ESTIMULO') return { iniciar() {}, parar() {} };
  await Tone.start(); // Deve ser chamado diretamente a partir do gesto Iniciar.
  const contexto = Tone.getContext();
  if (contexto.state !== 'running') throw new Error('Áudio indisponível');
  const sintetizador = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.005, decay: 0.025, sustain: 0, release: 0.015 },
    volume: -12 + 20 * Math.log10(Math.max(0.1, Math.min(1, volume))),
  }).toDestination();
  let encerrado = false;
  const ritmo = criarRitmoFixo(condicao === 'LENTO' ? 1 : 0.5,
    (instante) => {
      if (contexto.state !== 'running') throw new Error('Áudio interrompido');
      sintetizador.triggerAttackRelease('E5', 0.045, instante);
    }, falhar, { agora: () => contexto.immediate(), agendar: setTimeout, cancelar: clearTimeout });
  function parar() {
    if (encerrado) return;
    encerrado = true;
    ritmo.parar();
    contexto.off('statechange', observar);
    sintetizador.dispose(); // Libera também eventos de áudio já agendados.
  }
  function falhar() { parar(); aoErro(); }
  function observar() { if (!encerrado && contexto.state !== 'running') falhar(); }
  contexto.on('statechange', observar);
  return { iniciar: () => { if (!encerrado) ritmo.iniciar(); }, parar };
}

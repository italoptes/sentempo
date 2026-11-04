import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { prepararAudioEstudo } from '../utilitarios/audio_estudo';
import * as Tone from 'tone';

const simulado = vi.hoisted(() => ({
  contexto: { state: 'running', immediate: () => 10, on: vi.fn(), off: vi.fn() },
  tocar: vi.fn(), descartar: vi.fn(), configuracoes: vi.fn(),
}));
vi.mock('tone', () => ({
  start: vi.fn().mockResolvedValue(undefined),
  getContext: () => simulado.contexto,
  Synth: class {
    constructor(opcoes: unknown) { simulado.configuracoes(opcoes); }
    toDestination() { return this; }
    triggerAttackRelease(...args: unknown[]) { simulado.tocar(...args); }
    dispose() { simulado.descartar(); }
  },
}));
beforeEach(() => { vi.useFakeTimers(); simulado.contexto.state = 'running'; });
afterEach(() => { vi.useRealTimers(); });

it('silêncio não inicializa nem reproduz áudio', async () => {
  const audio = await prepararAudioEstudo('SEM_ESTIMULO', 0.5, vi.fn());
  audio.iniciar(); audio.parar();
  expect(Tone.start).not.toHaveBeenCalled();
  expect(simulado.tocar).not.toHaveBeenCalled();
});

it('usa o mesmo bip nos dois ritmos e descarta agendamentos ao parar', async () => {
  const lento = await prepararAudioEstudo('LENTO', 0.5, vi.fn());
  lento.iniciar(); lento.parar();
  const rapido = await prepararAudioEstudo('RAPIDO', 0.5, vi.fn());
  rapido.iniciar(); rapido.parar();
  expect(simulado.configuracoes.mock.calls[0]).toEqual(simulado.configuracoes.mock.calls[1]);
  expect(simulado.tocar.mock.calls).toEqual([['E5', 0.045, 10], ['E5', 0.045, 10]]);
  expect(simulado.descartar).toHaveBeenCalledTimes(2);
  expect(vi.getTimerCount()).toBe(0);
});

it('invalida quando o contexto deixa de reproduzir', async () => {
  const falha = vi.fn();
  const audio = await prepararAudioEstudo('RAPIDO', 0.5, falha);
  audio.iniciar();
  simulado.contexto.state = 'suspended';
  simulado.contexto.on.mock.calls[0][1]();
  expect(falha).toHaveBeenCalledTimes(1);
  expect(simulado.descartar).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
});

it('chama os temporizadores com o contexto Window exigido pelo navegador', async () => {
  const agendar = vi.spyOn(window, 'setTimeout');
  const cancelar = vi.spyOn(window, 'clearTimeout');
  const audio = await prepararAudioEstudo('LENTO', 0.5, vi.fn());
  audio.iniciar();
  audio.parar();
  expect(agendar.mock.contexts[0]).toBe(window);
  expect(cancelar.mock.contexts[0]).toBe(window);
  agendar.mockRestore(); cancelar.mockRestore();
});

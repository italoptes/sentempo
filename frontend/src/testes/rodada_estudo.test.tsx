import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DURACAO_PREPARACAO_MS, usarRodadaEstudo } from '../ganchos/usarRodadaEstudo';
import { prepararAudioEstudo } from '../utilitarios/audio_estudo';
import { consultarEstudo, salvarResultadoEstudo } from '../servicos/estudo';
import type { PosicaoEstudo, SessaoEstudo } from '../servicos/estudo';

vi.mock('../utilitarios/audio_estudo', () => ({ prepararAudioEstudo: vi.fn() }));
vi.mock('../servicos/estudo', () => ({ consultarEstudo: vi.fn(), salvarResultadoEstudo: vi.fn() }));
const posicao: PosicaoEstudo = { id: 't1', ordem: 1, bloco: 1, repeticao: 1, condicao: 'LENTO', tempo_alvo_ms: 5000,
  concluida: false, resultado_ms: null, erro_ms: null, erro_absoluto_ms: null, erro_relativo_percentual: null };
const sessao = { tentativas: [posicao], proxima: posicao } as SessaoEstudo;

describe('rodada do Estudo A', () => {
  const parar = vi.fn();
  const iniciar = vi.fn();
  let agora = 100;
  beforeEach(() => {
    vi.useFakeTimers();
    agora = 100;
    vi.spyOn(performance, 'now').mockImplementation(() => agora);
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    vi.mocked(prepararAudioEstudo).mockResolvedValue({ parar, iniciar });
  });
  afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

  async function concluirPreparacao() {
    await act(async () => { await vi.advanceTimersByTimeAsync(DURACAO_PREPARACAO_MS); });
  }

  it('interrompe sem salvar, reinicia a mesma posição e impede clique duplo', async () => {
    const atualizar = vi.fn();
    vi.mocked(salvarResultadoEstudo).mockResolvedValue(sessao);
    const { result } = renderHook(() => usarRodadaEstudo('p1', atualizar));
    await act(() => result.current.iniciar(posicao, 0.5));
    expect(result.current.estado).toBe('preparacao');
    await concluirPreparacao();
    expect(result.current.estado).toBe('ativa');
    act(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(result.current.estado).toBe('interrompida');
    expect(parar).toHaveBeenCalled();
    expect(salvarResultadoEstudo).not.toHaveBeenCalled();
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    await act(() => result.current.iniciar(posicao, 0.5));
    await concluirPreparacao();
    agora = 5123.4567;
    await act(async () => { await Promise.all([result.current.finalizar(), result.current.finalizar()]); });
    expect(salvarResultadoEstudo).toHaveBeenCalledTimes(1);
    expect(salvarResultadoEstudo).toHaveBeenCalledWith('p1', 't1', 5023.4567);
  });

  it('falha no áudio não envia duração parcial', async () => {
    const { result } = renderHook(() => usarRodadaEstudo('p1', vi.fn()));
    await act(() => result.current.iniciar(posicao, 0.5));
    await concluirPreparacao();
    act(() => vi.mocked(prepararAudioEstudo).mock.calls[0][2]());
    await act(() => result.current.finalizar());
    expect(result.current.estado).toBe('interrompida');
    expect(salvarResultadoEstudo).not.toHaveBeenCalled();
  });

  it('consulta confirmação perdida e avança sem reenviar resultado', async () => {
    const atualizar = vi.fn();
    const confirmada = { ...sessao, tentativas: [{ ...posicao, concluida: true }] };
    vi.mocked(salvarResultadoEstudo).mockRejectedValue(new Error('Conexão perdida'));
    vi.mocked(consultarEstudo).mockResolvedValue(confirmada);
    const { result } = renderHook(() => usarRodadaEstudo('p1', atualizar));
    await act(() => result.current.iniciar(posicao, 0.5));
    await concluirPreparacao();
    agora = 5100;
    await act(() => result.current.finalizar());
    expect(consultarEstudo).toHaveBeenCalledTimes(1);
    expect(atualizar).toHaveBeenCalledWith(confirmada);
    expect(result.current.estado).toBe('pronta');
    expect(salvarResultadoEstudo).toHaveBeenCalledTimes(1);
  });

  it('bloqueia repetição enquanto não consegue consultar confirmação', async () => {
    vi.mocked(salvarResultadoEstudo).mockRejectedValue(new Error('Conexão perdida'));
    vi.mocked(consultarEstudo).mockRejectedValue(new Error('Sem rede'));
    const { result } = renderHook(() => usarRodadaEstudo('p1', vi.fn()));
    await act(() => result.current.iniciar(posicao, 0.5));
    await concluirPreparacao();
    agora = 5100;
    await act(() => result.current.finalizar());
    expect(result.current.estado).toBe('confirmacao');
    await act(() => result.current.iniciar(posicao, 0.5));
    expect(prepararAudioEstudo).toHaveBeenCalledTimes(1);
    vi.mocked(consultarEstudo).mockResolvedValue(sessao);
    await act(() => result.current.verificarConfirmacao());
    expect(result.current.estado).toBe('interrompida');
  });

  it('libera áudio cuja preparação termina depois de sair da tela', async () => {
    let resolver: ((audio: { iniciar: () => void; parar: () => void }) => void) | undefined;
    vi.mocked(prepararAudioEstudo).mockImplementation(() => new Promise(res => { resolver = res; }));
    const { result, unmount } = renderHook(() => usarRodadaEstudo('p1', vi.fn()));
    let promessa: Promise<void> | undefined;
    act(() => { promessa = result.current.iniciar(posicao, 0.5); });
    unmount();
    await act(async () => { resolver?.({ iniciar, parar }); await promessa; });
    expect(parar).toHaveBeenCalled();
    expect(iniciar).not.toHaveBeenCalled();
  });
});

import { describe, expect, it, vi } from 'vitest';
import { criarRitmoFixo } from '../utilitarios/ritmo_fixo';

describe('ritmo fixo no relógio de áudio', () => {
  it.each([1, 0.5])('primeiro bip imediato e intervalos absolutos de %s segundo', intervalo => {
    let agora = 10;
    let callback: (() => void) | undefined;
    const emitir = vi.fn();
    const cancelar = vi.fn();
    const erro = vi.fn();
    const ritmo = criarRitmoFixo(intervalo, emitir, erro, {
      agora: () => agora,
      agendar: acao => { callback = acao; return 1 as unknown as ReturnType<typeof setTimeout>; }, cancelar,
    });
    ritmo.iniciar();
    ritmo.iniciar();
    expect(emitir.mock.calls).toEqual([[10]]);
    for (let i = 1; i <= 20; i++) { agora = 10 + i * 0.023; callback?.(); }
    if (intervalo === 0.5) expect(emitir.mock.calls).toEqual([[10], [10.5]]);
    else expect(emitir.mock.calls).toEqual([[10]]);
    ritmo.parar();
    const chamadas = emitir.mock.calls.length;
    agora = 30;
    callback?.();
    expect(emitir).toHaveBeenCalledTimes(chamadas);
    expect(cancelar).toHaveBeenCalled();
    expect(erro).not.toHaveBeenCalled();
  });

  it('interrompe callback atrasado sem reproduzir uma rajada', () => {
    let agora = 0;
    let callback: (() => void) | undefined;
    const emitir = vi.fn();
    const erro = vi.fn();
    criarRitmoFixo(0.5, emitir, erro, {
      agora: () => agora,
      agendar: acao => { callback = acao; return 1 as unknown as ReturnType<typeof setTimeout>; }, cancelar: vi.fn(),
    }).iniciar();
    agora = 4;
    callback?.();
    expect(emitir).toHaveBeenCalledTimes(1);
    expect(erro).toHaveBeenCalledTimes(1);
  });
});

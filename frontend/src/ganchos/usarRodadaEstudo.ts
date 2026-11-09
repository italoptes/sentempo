import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { consultarEstudo, salvarResultadoEstudo } from '../servicos/estudo';
import type { PosicaoEstudo, SessaoEstudo } from '../servicos/estudo';
import { prepararAudioEstudo } from '../utilitarios/audio_estudo';
import type { AudioEstudo } from '../utilitarios/audio_estudo';

export type EstadoEstudo = 'pronta' | 'preparando' | 'preparacao' | 'ativa' | 'interrompida' | 'salvando' | 'confirmacao';

export const DURACAO_PREPARACAO_MS = 1000;

export function usarRodadaEstudo(participanteId: string, aoAtualizar: (sessao: SessaoEstudo) => void) {
  const [estado, definirEstado] = useState<EstadoEstudo>('pronta');
  const [erro, definirErro] = useState<string | null>(null);
  const [consultando, definirConsultando] = useState(false);
  const estadoRef = useRef<EstadoEstudo>('pronta');
  const operacao = useRef(0);
  const montado = useRef(true);
  const inicio = useRef<number | null>(null);
  const timerPreparacao = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audio = useRef<AudioEstudo | null>(null);
  const alvo = useRef<PosicaoEstudo | null>(null);

  const mudar = useCallback((novo: EstadoEstudo) => {
    estadoRef.current = novo;
    if (montado.current) definirEstado(novo);
  }, []);
  const parar = useCallback(() => {
    operacao.current++;
    inicio.current = null;
    if (timerPreparacao.current !== null) clearTimeout(timerPreparacao.current);
    timerPreparacao.current = null;
    audio.current?.parar();
    audio.current = null;
  }, []);
  const interromper = useCallback(() => {
    if (!['ativa', 'preparando', 'preparacao'].includes(estadoRef.current)) return;
    parar();
    mudar('interrompida');
  }, [mudar, parar]);

  useEffect(() => {
    montado.current = true;
    const visibilidade = () => { if (document.hidden) interromper(); };
    document.addEventListener('visibilitychange', visibilidade);
    window.addEventListener('pagehide', interromper);
    return () => {
      montado.current = false;
      document.removeEventListener('visibilitychange', visibilidade);
      window.removeEventListener('pagehide', interromper);
      parar();
    };
  }, [interromper, parar]);

  const iniciar = useCallback(async (posicao: PosicaoEstudo, volume: number) => {
    if (!['pronta', 'interrompida'].includes(estadoRef.current)) return;
    const numero = ++operacao.current;
    alvo.current = posicao;
    mudar('preparando');
    definirErro(null);
    try {
      const controle = await prepararAudioEstudo(posicao.condicao, volume, interromper);
      if (numero !== operacao.current || !montado.current) { controle.parar(); return; }
      audio.current = controle;
      if (document.hidden) { interromper(); return; }
      mudar('preparacao');
      timerPreparacao.current = setTimeout(() => {
        timerPreparacao.current = null;
        if (numero !== operacao.current || !montado.current || document.hidden) return;
        mudar('ativa');
      }, DURACAO_PREPARACAO_MS);
    } catch {
      if (numero !== operacao.current || !montado.current) return;
      interromper();
    }
  }, [interromper, mudar]);

  useLayoutEffect(() => {
    if (estado !== 'ativa' || inicio.current !== null) return;
    inicio.current = performance.now();
    audio.current?.iniciar();
  }, [estado]);

  const verificarConfirmacao = useCallback(async () => {
    if (!alvo.current) return;
    definirConsultando(true);
    try {
      const sessao = await consultarEstudo(participanteId);
      if (!montado.current) return;
      if (!sessao) throw new Error('Sessão indisponível');
      if (sessao.tentativas.find(t => t.id === alvo.current?.id)?.concluida) {
        aoAtualizar(sessao);
        mudar('pronta');
        definirErro(null);
      } else {
        aoAtualizar(sessao);
        mudar('interrompida');
        definirErro('O servidor não confirmou um resultado para esta tentativa. Você pode recomeçá-la.');
      }
    } catch {
      if (montado.current) {
        mudar('confirmacao');
        definirErro('Não foi possível consultar a confirmação. Verifique sua conexão e consulte novamente.');
      }
    } finally { if (montado.current) definirConsultando(false); }
  }, [aoAtualizar, mudar, participanteId]);

  const finalizar = useCallback(async () => {
    if (estadoRef.current !== 'ativa' || inicio.current === null || !alvo.current) return;
    const resultado = performance.now() - inicio.current;
    const tentativaId = alvo.current.id;
    mudar('salvando'); // Trava sincronamente antes de qualquer await/clique adicional.
    parar();
    try {
      const sessao = await salvarResultadoEstudo(participanteId, tentativaId, resultado);
      if (!montado.current) return;
      aoAtualizar(sessao);
      mudar('pronta');
    } catch {
      if (!montado.current) return;
      mudar('confirmacao');
      definirErro('O salvamento não foi confirmado. Consulte o servidor antes de continuar.');
      await verificarConfirmacao();
    }
  }, [aoAtualizar, mudar, parar, participanteId, verificarConfirmacao]);

  return { estado, erro, consultando, iniciar, finalizar, verificarConfirmacao };
}

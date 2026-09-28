// ganchos/usarExperimento.ts — Gerencia o estado de uma rodada do experimento

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { Condicao } from '../utilitarios/estimulo';
import { prepararEstimulo } from '../utilitarios/estimulo';
import type { ControleEstimulo } from '../utilitarios/estimulo';
import { salvarTentativa } from '../servicos/tentativas';
import { ErroAPI } from '../servicos/api';

export type EstadoRodada =
  | 'preparacao'
  | 'preparando'
  | 'ativa'
  | 'finalizando'
  | 'erro-audio'
  | 'erro-rede'
  | 'concluida';

export function usarExperimento(
  participanteId: string,
  tipoTentativa: 'OFICIAL' | 'PERSONALIZADA' = 'OFICIAL',
  tempoId?: string,
) {
  const [estado, setEstado] = useState<EstadoRodada>('preparacao');
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [pulseCount, setPulseCount] = useState(0);
  const [duracaoEspera, setDuracaoEspera] = useState(0);

  const inicioRef = useRef<number | null>(null);
  const controleRef = useRef<ControleEstimulo | null>(null);
  const finalizadoRef = useRef(false);
  const iniciandoRef = useRef(false);
  const operacaoRef = useRef(0);
  const esperaRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Callback disparado a cada pulso do estímulo (som + animação via Motion) */
  const aoDisparar = useCallback(() => {
    setPulseCount((c) => c + 1);
  }, []);

  const iniciarRodada = useCallback(async (condicao: Condicao) => {
    if (iniciandoRef.current) return;
    iniciandoRef.current = true;
    const operacao = ++operacaoRef.current;
    setEstado('preparando');
    setMensagemErro(null);
    finalizadoRef.current = false;

    // Gera duração aleatória entre 900ms e 1400ms para a barra de progresso
    const tempoEspera = 900 + Math.floor(Math.random() * 501);
    setDuracaoEspera(tempoEspera);

    try {
      const controle = await prepararEstimulo(
        condicao,
        aoDisparar,
        (motivo) => {
          if (operacao !== operacaoRef.current) return;
          inicioRef.current = null;
          controleRef.current?.parar();
          controleRef.current = null;
          setEstado('erro-audio');
          setMensagemErro(`Erro de áudio: ${motivo}. A rodada foi cancelada.`);
        },
      );
      if (operacao !== operacaoRef.current) {
        controle.parar();
        return;
      }
      controleRef.current = controle;

      esperaRef.current = setTimeout(() => {
        esperaRef.current = null;
        if (operacao === operacaoRef.current) setEstado('ativa');
      }, tempoEspera);
    } catch (e) {
      if (operacao !== operacaoRef.current) return;
      setEstado('erro-audio');
      setMensagemErro(
        `Não foi possível iniciar o áudio: ${e instanceof Error ? e.message : 'erro desconhecido'}. ` +
        'Verifique as permissões do navegador e tente novamente.',
      );
    }
  }, [aoDisparar]);

  useLayoutEffect(() => {
    if (estado !== 'ativa' || inicioRef.current !== null) return;
    inicioRef.current = performance.now();
    controleRef.current?.iniciar();
  }, [estado]);

  const finalizarRodada = useCallback(
    async (tempoAlvoMs: number, condicao: Condicao) => {
      // Impede clique duplo
      if (finalizadoRef.current || estado !== 'ativa' || inicioRef.current === null) return;
      finalizadoRef.current = true;

      // Para agendamentos imediatamente
      controleRef.current?.parar();
      controleRef.current = null;

      // Calcula resultado sem arredondamento prévio (performance.now em ms)
      const resultadoMs = performance.now() - inicioRef.current;
      inicioRef.current = null;

      setEstado('finalizando');

      try {
        await salvarTentativa(participanteId, {
          tempo_alvo_ms: tempoAlvoMs,
          condicao,
          resultado_ms: resultadoMs,
          tipo_tentativa: tipoTentativa,
          tempo_personalizado_id: tempoId,
        });
        setEstado('concluida');
      } catch (e) {
        finalizadoRef.current = false;
        if (e instanceof ErroAPI && e.status === 409) {
          // Combinação já concluída — trata no componente
          setEstado('concluida');
          setMensagemErro('409');
        } else {
          setEstado('erro-rede');
          setMensagemErro(
            'O resultado não foi confirmado. Verifique sua conexão. ' +
            'Não tente novamente sem verificar o progresso no menu.',
          );
        }
      }
    },
    [estado, participanteId, tipoTentativa, tempoId],
  );

  const limpar = useCallback(() => {
    operacaoRef.current += 1;
    if (esperaRef.current !== null) clearTimeout(esperaRef.current);
    esperaRef.current = null;
    iniciandoRef.current = false;
    controleRef.current?.parar();
    controleRef.current = null;
    inicioRef.current = null;
    finalizadoRef.current = false;
    setEstado('preparacao');
    setMensagemErro(null);
    setPulseCount(0);
  }, []);

  return { estado, mensagemErro, pulseCount, duracaoEspera, iniciarRodada, finalizarRodada, limpar };
}

// ganchos/usarExperimento.ts — Gerencia o estado de uma rodada do experimento

import { useCallback, useRef, useState } from 'react';
import type { Condicao } from '../utilitarios/estimulo';
import { iniciarEstimulo } from '../utilitarios/estimulo';
import type { ControleEstimulo } from '../utilitarios/estimulo';
import { salvarTentativa } from '../servicos/tentativas';
import { ErroAPI } from '../servicos/api';

export type EstadoRodada =
  | 'preparacao'
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

  const inicioRef = useRef<number | null>(null);
  const controleRef = useRef<ControleEstimulo | null>(null);
  const finalizadoRef = useRef(false);

  /** Callback disparado a cada pulso do estímulo (som + animação via Motion) */
  const aoDisparar = useCallback(() => {
    setPulseCount((c) => c + 1);
  }, []);

  const iniciarRodada = useCallback(async (condicao: Condicao) => {
    setEstado('preparacao');
    setMensagemErro(null);
    finalizadoRef.current = false;

    try {
      // Inicia estímulo (para SEM_ESTIMULO retorna imediatamente)
      const controle = await iniciarEstimulo(
        condicao,
        aoDisparar,
        (motivo) => {
          controle.parar();
          setEstado('erro-audio');
          setMensagemErro(`Erro de áudio: ${motivo}. A rodada foi cancelada.`);
        },
      );
      controleRef.current = controle;

      // Registra início APÓS preparação bem-sucedida
      inicioRef.current = performance.now();
      setEstado('ativa');
    } catch (e) {
      setEstado('erro-audio');
      setMensagemErro(
        `Não foi possível iniciar o áudio: ${e instanceof Error ? e.message : 'erro desconhecido'}. ` +
        'Verifique as permissões do navegador e tente novamente.',
      );
    }
  }, [aoDisparar]);

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
    controleRef.current?.parar();
    controleRef.current = null;
    inicioRef.current = null;
    finalizadoRef.current = false;
    setEstado('preparacao');
    setMensagemErro(null);
    setPulseCount(0);
  }, []);

  return { estado, mensagemErro, pulseCount, iniciarRodada, finalizarRodada, limpar };
}

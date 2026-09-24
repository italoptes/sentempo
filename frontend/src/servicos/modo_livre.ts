// servicos/modo_livre.ts — Chamadas de API para o Modo Livre

import { requisicao } from './api';

export interface TempoPersonalizadoResposta {
  id: string;
  tempo_alvo_ms: number;
  ativo: boolean;
  criado_em: string;
}

export interface ModoLivreStatus {
  desbloqueado: boolean;
  tempos: TempoPersonalizadoResposta[];
}

export async function obterStatusModoLivre(participanteId: string): Promise<ModoLivreStatus> {
  return requisicao<ModoLivreStatus>(`/participantes/${participanteId}/modo-livre`);
}

export async function criarTempoPersonalizado(
  participanteId: string,
  tempoAlvoMs: number
): Promise<TempoPersonalizadoResposta> {
  return requisicao<TempoPersonalizadoResposta>(`/participantes/${participanteId}/tempos-personalizados`, {
    metodo: 'POST',
    corpo: { tempo_alvo_ms: tempoAlvoMs },
  });
}

export async function excluirTempoPersonalizado(
  participanteId: string,
  tempoId: string
): Promise<void> {
  return requisicao<void>(`/participantes/${participanteId}/tempos-personalizados/${tempoId}`, {
    metodo: 'DELETE',
  });
}

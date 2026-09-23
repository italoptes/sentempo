// servicos/tentativas.ts — Chamadas de API para tentativas

import type { Tentativa } from '../tipos/participante';
import { requisicao } from './api';

export interface DadosTentativa {
  tempo_alvo_ms: number;
  condicao: string;
  resultado_ms: number;
}

export async function salvarTentativa(
  participanteId: string,
  dados: DadosTentativa,
): Promise<Tentativa> {
  return requisicao<Tentativa>(`/participantes/${participanteId}/tentativas`, {
    metodo: 'POST',
    corpo: dados,
  });
}

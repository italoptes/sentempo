// servicos/participantes.ts — Chamadas de API para participantes

import type { ParticipanteAcesso, ParticipanteDetalhe } from '../tipos/participante';
import { requisicao } from './api';

export async function acessarParticipante(
  nome: string,
  codigo: string,
): Promise<ParticipanteAcesso> {
  return requisicao<ParticipanteAcesso>('/participantes/acessar', {
    metodo: 'POST',
    corpo: { nome, codigo },
  });
}

export async function consultarParticipante(id: string): Promise<ParticipanteDetalhe> {
  return requisicao<ParticipanteDetalhe>(`/participantes/${id}`);
}

// servicos/administracao.ts — Chamadas de API administrativas

import type {
  EstatisticasResposta,
  PaginaParticipantes,
  ParticipanteAdministracao,
  ResumoAdministracao,
  TokenResposta,
} from '../tipos/administracao';
import { requisicao } from './api';

export async function loginAdministracao(
  nome: string,
  codigo: string,
): Promise<TokenResposta> {
  return requisicao<TokenResposta>('/administracao/acessar', {
    metodo: 'POST',
    corpo: { nome, codigo },
  });
}

export async function obterResumo(token: string): Promise<ResumoAdministracao> {
  return requisicao<ResumoAdministracao>('/administracao/resumo', { token });
}

export async function obterEstatisticas(
  token: string,
  agrupar_por: 'condicao' | 'tempo' | 'tempo_condicao',
): Promise<EstatisticasResposta> {
  return requisicao<EstatisticasResposta>(
    `/administracao/estatisticas?agrupar_por=${agrupar_por}`,
    { token },
  );
}

export async function listarParticipantes(
  token: string,
  pagina: number,
  tamanho: number,
  busca?: string,
): Promise<PaginaParticipantes> {
  const params = new URLSearchParams({
    pagina: String(pagina),
    tamanho: String(tamanho),
  });
  if (busca) params.set('busca', busca);
  return requisicao<PaginaParticipantes>(`/administracao/participantes?${params}`, { token });
}

export async function detalharParticipante(
  token: string,
  id: string,
): Promise<ParticipanteAdministracao> {
  return requisicao<ParticipanteAdministracao>(`/administracao/participantes/${id}`, { token });
}

export function urlExportacaoCSV(token: string): string {
  const urlBase = import.meta.env.VITE_URL_API ?? '/api';
  return `${urlBase}/administracao/exportacao.csv?token=${encodeURIComponent(token)}`;
}

export async function excluirParticipante(token: string, id: string): Promise<void> {
  return requisicao<void>(`/administracao/participantes/${id}`, {
    metodo: 'DELETE',
    token,
  });
}

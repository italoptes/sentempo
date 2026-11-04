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

export type OrigemExportacao = 'ANTERIOR' | 'ESTUDO_A' | 'LIVRE';
export async function baixarCSV(token: string, origem: OrigemExportacao): Promise<void> {
  const base = import.meta.env.VITE_URL_API ?? '/api';
  const resposta = await fetch(`${base}/administracao/exportacao.csv?origem=${origem}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!resposta.ok) throw new Error(`Não foi possível exportar (HTTP ${resposta.status}). Verifique sua sessão.`);
  const url = URL.createObjectURL(await resposta.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = `sentempo-${origem.toLowerCase()}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function excluirParticipante(token: string, id: string): Promise<void> {
  return requisicao<void>(`/administracao/participantes/${id}`, {
    metodo: 'DELETE',
    token,
  });
}

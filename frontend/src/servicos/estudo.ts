import { requisicao } from './api';

export type CondicaoEstudo = 'SEM_ESTIMULO' | 'LENTO' | 'RAPIDO';
export interface PosicaoEstudo {
  id: string;
  ordem: number;
  bloco: number;
  repeticao: number;
  condicao: CondicaoEstudo;
  tempo_alvo_ms: number;
  concluida: boolean;
  resultado_ms: number | null;
  erro_ms: number | null;
  erro_absoluto_ms: number | null;
  erro_relativo_percentual: number | null;
}
export interface SessaoEstudo {
  id: string;
  versao_protocolo: string;
  sequencia: number;
  ordem_condicoes: CondicaoEstudo[];
  dispositivo: string;
  usa_fones: boolean;
  volume: number;
  consentido_em: string;
  concluida_em: string | null;
  bloco_liberado: number;
  concluidas: number;
  total: number;
  situacao: 'EM_ANDAMENTO' | 'INTERVALO' | 'CONCLUIDA';
  proxima: PosicaoEstudo | null;
  blocos: { posicao: number; condicao: CondicaoEstudo; concluidas: number; total: number }[];
  tentativas: PosicaoEstudo[];
}
export interface ContextoEstudo {
  consentimento: true;
  audio_testado: true;
  dispositivo: 'COMPUTADOR' | 'CELULAR' | 'TABLET' | 'OUTRO';
  usa_fones: boolean;
  volume: number;
}
const caminho = (participanteId: string) => `/participantes/${participanteId}/estudo-a`;
export const consultarEstudo = (id: string) => requisicao<SessaoEstudo | null>(caminho(id));
export const criarEstudo = (id: string, dados: ContextoEstudo) => requisicao<SessaoEstudo>(caminho(id), { metodo: 'POST', corpo: dados });
export const continuarEstudo = (id: string) => requisicao<SessaoEstudo>(`${caminho(id)}/continuar`, { metodo: 'POST' });
export const salvarResultadoEstudo = (id: string, tentativaId: string, resultadoMs: number) =>
  requisicao<SessaoEstudo>(`${caminho(id)}/tentativas/${tentativaId}`, { metodo: 'POST', corpo: { resultado_ms: resultadoMs } });

export const rotularCondicaoEstudo = (condicao: string) => ({ SEM_ESTIMULO: 'Silêncio', LENTO: 'Bipes lentos (60 BPM)', RAPIDO: 'Bipes rápidos (120 BPM)' })[condicao] ?? condicao;

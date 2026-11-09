import { requisicao } from './api';

export type CondicaoEstudo = 'SEM_ESTIMULO' | 'LENTO' | 'RAPIDO';
export type VersaoEstudo = 'ESTUDO_A_V1' | 'ESTUDO_A_V2';
export interface PosicaoEstudo {
  id: string;
  ordem: number;
  bloco: number;
  repeticao: number;
  condicao: CondicaoEstudo;
  tempo_alvo_ms: number;
  concluida: boolean;
  confianca?: number | null;
  questionario_respondido?: boolean;
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
  situacao: 'EM_ANDAMENTO' | 'INTERVALO' | 'CONCLUIDA' | 'QUESTIONARIO_TENTATIVA' | 'QUESTIONARIO_BLOCO' | 'QUESTIONARIO_FINAL';
  proxima: PosicaoEstudo | null;
  blocos: { posicao: number; condicao: CondicaoEstudo; concluidas: number; total: number }[];
  tentativas: PosicaoEstudo[];
  questionario_pendente: PerguntaPendente | null;
  respostas_blocos: { bloco: number; agradabilidade: number | null; ansiedade: number | null }[];
  estrategia: string | null;
  comentario: string | null;
}
export interface PerguntaPendente { tipo: 'TENTATIVA' | 'BLOCO' | 'FINAL'; tentativa_id?: string; ordem?: number; bloco?: number }
export interface RespostaQuestionario {
  tipo: PerguntaPendente['tipo'];
  tentativa_id?: string;
  bloco?: number;
  confianca?: number | null;
  agradabilidade?: number | null;
  ansiedade?: number | null;
  estrategia?: string | null;
  comentario?: string | null;
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
export const responderQuestionario = (id: string, resposta: RespostaQuestionario) =>
  requisicao<SessaoEstudo>(`${caminho(id)}/questionario`, { metodo: 'POST', corpo: resposta });

export const rotularCondicaoEstudo = (condicao: string) => ({ SEM_ESTIMULO: 'Silêncio', LENTO: 'Bipes lentos (60 BPM)', RAPIDO: 'Bipes rápidos (120 BPM)' })[condicao] ?? condicao;

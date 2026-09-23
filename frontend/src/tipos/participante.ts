// tipos/participante.ts — Tipos relacionados ao participante

export interface Progresso {
  concluidas: number;
  total: number;
}

export interface ParticipanteAcesso {
  id: string;
  nome: string;
  codigo: string;
  progresso: Progresso;
}

export interface Combinacao {
  tempo_alvo_ms: number;
  condicao: string;
  concluida: boolean;
}

export interface Tentativa {
  id: string;
  participante_id?: string;
  tempo_alvo_ms: number;
  condicao: string;
  resultado_ms: number;
  erro_ms: number;
  erro_absoluto_ms: number;
  criado_em: string;
}

export interface ParticipanteDetalhe extends ParticipanteAcesso {
  tentativas: Tentativa[];
  combinacoes: Combinacao[];
}

// tipos/administracao.ts — Tipos do dashboard administrativo

export interface TendenciaResposta {
  predominante: string;
  abaixo: number;
  acima: number;
  igual: number;
}

export interface ResumoAdministracao {
  participantes_total: number;
  participantes_completos: number;
  tentativas_validas_total: number;
  tentativas_esperadas: number;
  taxa_conclusao_percentual: number;
  erro_medio_ms: number;
  erro_absoluto_medio_ms: number;
  tendencia_geral: TendenciaResposta;
}

export interface EstatisticaItem {
  chave: string;
  quantidade_tentativas: number;
  erro_medio_ms: number;
  erro_absoluto_medio_ms: number;
  abaixo: number;
  acima: number;
  igual: number;
  tendencia_predominante: string;
}

export interface EstatisticasResposta {
  agrupar_por: string;
  itens: EstatisticaItem[];
}

export interface ParticipanteListaItem {
  id: string;
  nome: string;
  codigo: string;
  criado_em: string;
  tentativas_concluidas: number;
  situacao: string;
}

export interface PaginaParticipantes {
  pagina: number;
  tamanho: number;
  total_itens: number;
  total_paginas: number;
  itens: ParticipanteListaItem[];
}

export interface ResumoIndividual {
  erro_medio_ms: number;
  erro_absoluto_medio_ms: number;
  tendencia: TendenciaResposta;
}

export interface ParticipanteAdministracao {
  participante: import('./participante').ParticipanteDetalhe;
  resumo: ResumoIndividual;
}

export interface TokenResposta {
  token_acesso: string;
  tipo_token: string;
  expira_em: string;
}

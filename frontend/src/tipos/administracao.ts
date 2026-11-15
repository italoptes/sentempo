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

export interface ResultadoAnaliseEstudo {
  condicao: import('../servicos/estudo').CondicaoEstudo;
  tempo_alvo_ms: number;
  participantes: number;
  erro_assinado_medio_ms: number | null;
  erro_absoluto_medio_ms: number | null;
  erro_relativo_medio_percentual: number | null;
}

export interface ComparacaoPareadaEstudo {
  condicao: Exclude<import('../servicos/estudo').CondicaoEstudo, 'SEM_ESTIMULO'>;
  referencia: 'SEM_ESTIMULO';
  tempo_alvo_ms: number;
  pares: number;
  diferenca_erro_assinado_media_ms: number | null;
  diferenca_erro_absoluto_media_ms: number | null;
  diferenca_erro_relativo_media_pp: number | null;
  mais_cedo: number;
  mais_tarde: number;
  mesmo_tempo: number;
}

export interface AnaliseEstudo {
  criterio_inclusao: 'SESSOES_CONCLUIDAS';
  participantes: number;
  resultados: ResultadoAnaliseEstudo[];
  comparacoes: ComparacaoPareadaEstudo[];
}

export interface PainelEstudo {
  versao_protocolo: string;
  sessoes_total: number;
  sessoes_completas: number;
  tentativas_concluidas: number;
  pagina: number;
  total_paginas: number;
  sessoes: (import('../servicos/estudo').SessaoEstudo & {
    codigo_participante: string;
    nome_participante: string;
  })[];
  estatisticas: {
    condicao: string;
    tempo_alvo_ms: number;
    quantidade: number;
    erro_medio_ms: number;
    erro_absoluto_medio_ms: number;
    erro_relativo_medio_percentual: number;
    abaixo: number;
    acima: number;
    igual: number;
  }[];
  analise?: AnaliseEstudo | null;
}

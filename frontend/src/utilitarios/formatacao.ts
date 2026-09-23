// utilitarios/formatacao.ts — Formatação de valores para exibição

/** Formata milissegundos como segundos com 2 casas decimais: "5,32 s" */
export function formatarSegundos(ms: number): string {
  return (ms / 1000).toFixed(2).replace('.', ',') + ' s';
}

/** Formata erro em segundos com sinal: "+0,321 s" ou "−0,378 s" */
export function formatarErro(ms: number): string {
  const sinal = ms >= 0 ? '+' : '−';
  return `${sinal}${(Math.abs(ms) / 1000).toFixed(3).replace('.', ',')} s`;
}

/** Formata erro absoluto em segundos */
export function formatarErroAbsoluto(ms: number): string {
  return (Math.abs(ms) / 1000).toFixed(3).replace('.', ',') + ' s';
}

/** Rótulo legível do tempo-alvo */
export function rotularTempo(ms: number): string {
  switch (ms) {
    case 5000: return '5 segundos';
    case 15000: return '15 segundos';
    case 30000: return '30 segundos';
    default: return `${ms} ms`;
  }
}

/** Rótulo legível da condição */
export function rotularCondicao(condicao: string): string {
  switch (condicao) {
    case 'SEM_ESTIMULO': return 'Sem Estímulo';
    case 'RAPIDO': return 'Estímulo Rápido';
    case 'LENTO': return 'Estímulo Lento';
    default: return condicao;
  }
}

/** Formata data ISO para português: "23/09/2026 às 14:30" */
export function formatarData(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

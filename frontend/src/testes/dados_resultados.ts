import type { CondicaoEstudo, PosicaoEstudo, SessaoEstudo } from '../servicos/estudo';

const ordem: CondicaoEstudo[] = ['RAPIDO', 'SEM_ESTIMULO', 'LENTO'];
const resultados = { RAPIDO: [4000, 9000, 14000], SEM_ESTIMULO: [4800, 10300, 15000], LENTO: [5500, 11000, 16500] };
const tempos = [5000, 10000, 15000];

export const sessaoResultados: SessaoEstudo = {
  id: 'sessao-demonstracao', versao_protocolo: 'ESTUDO_A_V2', sequencia: 4,
  ordem_condicoes: ordem, dispositivo: 'CELULAR', usa_fones: true, volume: 0.5,
  consentido_em: '2026-11-09T12:00:00Z', concluida_em: '2026-11-09T12:10:00Z',
  bloco_liberado: 3, concluidas: 9, total: 9, situacao: 'CONCLUIDA', proxima: null,
  blocos: ordem.map((condicao, indice) => ({ posicao: indice + 1, condicao, concluidas: 3, total: 3 })),
  tentativas: ordem.flatMap((condicao, bloco) => [10000, 5000, 15000].map((tempo, indice): PosicaoEstudo => {
    const resultado = resultados[condicao][tempos.indexOf(tempo)];
    const erro = resultado - tempo;
    return { id: `${condicao}-${tempo}`, ordem: bloco * 3 + indice + 1, bloco: bloco + 1,
      repeticao: 1, condicao, tempo_alvo_ms: tempo, concluida: true,
      resultado_ms: resultado, erro_ms: erro, erro_absoluto_ms: Math.abs(erro), erro_relativo_percentual: erro / tempo * 100 };
  })),
  questionario_pendente: null, respostas_blocos: [], estrategia: null, comentario: null,
};

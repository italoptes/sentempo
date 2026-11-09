import type { ReactNode } from 'react';
import type { PosicaoEstudo, SessaoEstudo } from '../servicos/estudo';
import { rotularCondicaoEstudo } from '../servicos/estudo';
import { formatarData, formatarErro, formatarErroAbsoluto, formatarSegundos } from '../utilitarios/formatacao';

type SessaoAdministrativa = SessaoEstudo & { codigo_participante: string };

const situacoes: Record<SessaoEstudo['situacao'], string> = {
  CONCLUIDA: 'Concluída', EM_ANDAMENTO: 'Em andamento', INTERVALO: 'Em intervalo',
  QUESTIONARIO_TENTATIVA: 'Questionário da tentativa', QUESTIONARIO_BLOCO: 'Questionário do bloco', QUESTIONARIO_FINAL: 'Questionário final',
};
const estrategias: Record<string, string> = {
  SEM_CONTAGEM: 'Estimou sem contar', CONTAGEM_MENTAL: 'Contou mentalmente',
  CONTAGEM_BIPES: 'Usou os bipes para contar', COMBINADA: 'Combinou estratégias', OUTRA: 'Outra estratégia',
};

function Campo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return <div className="min-w-0 space-y-1"><dt className="text-xs text-texto-secundario">{titulo}</dt><dd className="text-sm font-medium break-words">{children}</dd></div>;
}

function valoresTentativa(t: PosicaoEstudo): [string, ReactNode][] {
  const numero = (valor: number | null, formatar: (n: number) => string) =>
    t.concluida && valor !== null ? formatar(valor) : '—';
  return [
    ['Tentativa', <span key="ordem" className="font-medium">#{t.ordem}{!t.concluida && <span className="ml-2 text-xs text-texto-secundario">Pendente</span>}</span>],
    ['Repetição', t.repeticao],
    ['Alvo', `${t.tempo_alvo_ms / 1000} s`],
    ['Resultado', numero(t.resultado_ms, formatarSegundos)],
    ['Erro', numero(t.erro_ms, formatarErro)],
    ['Erro absoluto', numero(t.erro_absoluto_ms, formatarErroAbsoluto)],
    ['Erro relativo', numero(t.erro_relativo_percentual, n => `${n.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}%`)],
    ['Confiança', !t.questionario_respondido ? 'Pendente' : t.confianca == null ? 'Não respondeu' : `${t.confianca}/7`],
  ];
}

export function SessaoAdministracao({ sessao: s }: { sessao: SessaoAdministrativa }) {
  const blocos = [...new Set([...s.blocos.map(b => b.posicao), ...s.tentativas.map(t => t.bloco)])].sort((a, b) => a - b);
  return <details className="group/sessao">
    <summary className="cursor-pointer p-4 text-sm leading-6 sm:p-5">
      <span className="inline-flex w-[calc(100%-1.5rem)] flex-wrap items-center justify-between gap-2 align-middle">
        <span className="font-semibold" title={s.codigo_participante}>Participante {s.codigo_participante.slice(0, 8)}</span>
        <span className="flex flex-wrap items-center gap-3"><span className="text-texto-secundario">{s.concluidas}/{s.total} tentativas</span><span className={`rounded-full px-3 py-1 text-xs font-medium ${s.concluida_em ? 'bg-destaque-claro/50' : 'bg-fundo'}`}>{situacoes[s.situacao]}</span></span>
      </span>
    </summary>
    <div className="space-y-6 border-t border-destaque-claro bg-fundo/40 p-3 sm:p-5">
      <section aria-label="Configuração da sessão" className="rounded-xl border border-destaque-claro bg-branco p-4">
        <h4 className="mb-4 text-sm font-semibold">Configuração da sessão</h4>
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Campo titulo="Dispositivo">{{ COMPUTADOR: 'Computador', CELULAR: 'Celular', TABLET: 'Tablet', OUTRO: 'Outro' }[s.dispositivo] ?? s.dispositivo}</Campo>
          <Campo titulo="Fones de ouvido">{s.usa_fones ? 'Sim' : 'Não'}</Campo>
          <Campo titulo="Volume configurado">{Math.round(s.volume * 100)}%</Campo>
          <Campo titulo="Início da sessão">{formatarData(s.consentido_em)}</Campo>
        </dl>
      </section>

      <section aria-label="Resultados por bloco" className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h4 className="font-semibold">Resultados por bloco</h4>
          <p className="text-xs text-texto-secundario">Respostas de confiança, agradabilidade e ansiedade: escala de 1 a 7.</p>
        </div>
        {blocos.map(bloco => {
          const tentativas = s.tentativas.filter(t => t.bloco === bloco).sort((a, b) => a.ordem - b.ordem);
          const condicao = s.blocos.find(b => b.posicao === bloco)?.condicao ?? tentativas[0]?.condicao ?? s.ordem_condicoes[bloco - 1];
          const resposta = s.respostas_blocos.find(b => b.bloco === bloco);
          const nota = (valor: number | null | undefined) => valor == null ? resposta ? 'Não respondeu' : 'Pendente' : `${valor}/7`;
          return <section key={bloco} aria-label={`Bloco ${bloco}`} className="overflow-hidden rounded-xl border border-destaque-claro bg-branco">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-destaque-claro bg-destaque-claro/20 px-4 py-3">
              <h5 className="text-sm font-semibold">Bloco {bloco} <span className="mx-1 text-texto-secundario">·</span> {rotularCondicaoEstudo(condicao)}</h5>
              <span className="text-xs text-texto-secundario">{tentativas.filter(t => t.concluida).length}/{tentativas.length} concluídas</span>
            </div>
            <div className="overflow-x-auto"><table className="block w-full text-sm md:table md:min-w-[760px]">
              <caption className="sr-only">Tentativas do bloco {bloco} — {rotularCondicaoEstudo(condicao)}</caption>
              <thead className="hidden bg-fundo text-xs text-texto-secundario md:table-header-group"><tr>{['Tentativa', 'Repetição', 'Alvo', 'Resultado', 'Erro', 'Erro absoluto', 'Erro relativo', 'Confiança'].map(titulo => <th key={titulo} scope="col" className="px-3 py-3 text-left font-medium">{titulo}</th>)}</tr></thead>
              <tbody className="block md:table-row-group">{tentativas.map(t => <tr key={t.id} className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-destaque-claro p-4 last:border-b-0 md:table-row md:p-0">
                {valoresTentativa(t).map(([titulo, valor]) => <td key={titulo} className={`min-w-0 md:px-3 md:py-3 ${titulo === 'Resultado' ? 'font-semibold' : ''}`}>
                  <span className="mb-1 block text-xs font-normal text-texto-secundario md:hidden">{titulo}</span>
                  <span className="tabular-nums">{valor}</span>
                </td>)}
              </tr>)}</tbody>
            </table></div>
            <dl className="grid grid-cols-2 gap-4 border-t border-destaque-claro bg-fundo/60 px-4 py-3 sm:flex sm:gap-10">
              <Campo titulo="Agradabilidade do bloco">{nota(resposta?.agradabilidade)}</Campo>
              <Campo titulo="Ansiedade no bloco">{nota(resposta?.ansiedade)}</Campo>
            </dl>
          </section>;
        })}
      </section>

      <section aria-label="Questionário final" className="rounded-xl border border-destaque-claro bg-branco p-4">
        <h4 className="mb-4 text-sm font-semibold">Questionário final</h4>
        <dl className="space-y-4">
          <Campo titulo="Estratégia utilizada">{s.estrategia ? estrategias[s.estrategia] ?? s.estrategia : s.concluida_em ? 'Preferiu não responder' : 'Pendente'}</Campo>
          <Campo titulo="Comentário"><span className="whitespace-pre-wrap break-words font-normal">{s.comentario || (s.concluida_em ? 'Nenhum comentário informado.' : 'Pendente')}</span></Campo>
        </dl>
      </section>

      <details className="rounded-xl border border-destaque-claro bg-branco px-4 py-1">
        <summary className="min-h-11 cursor-pointer py-3 text-xs font-medium text-texto-secundario">Identificação da sessão</summary>
        <dl className="grid gap-4 pb-4 sm:grid-cols-2">
          <Campo titulo="ID do participante"><span className="break-all font-mono text-xs">{s.codigo_participante}</span></Campo>
          <Campo titulo="ID da sessão"><span className="break-all font-mono text-xs">{s.id}</span></Campo>
          <Campo titulo="Sequência">{s.sequencia + 1}</Campo>
          <Campo titulo="Conclusão">{s.concluida_em ? formatarData(s.concluida_em) : 'Em andamento'}</Campo>
        </dl>
      </details>
    </div>
  </details>;
}

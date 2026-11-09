import { useId, useRef, useState } from 'react';
import type { CondicaoEstudo, PosicaoEstudo, SessaoEstudo } from '../servicos/estudo';
import { formatarErro, formatarErroAbsoluto, formatarSegundos } from '../utilitarios/formatacao';

const CONDICOES: { codigo: CondicaoEstudo; titulo: string; descricao: string; detalhe: string }[] = [
  { codigo: 'SEM_ESTIMULO', titulo: 'Silêncio', descricao: 'Sem som', detalhe: 'Estimativas sem estímulo sonoro.' },
  { codigo: 'LENTO', titulo: 'Bipes lentos', descricao: '60 BPM', detalhe: 'Um bip a cada segundo.' },
  { codigo: 'RAPIDO', titulo: 'Bipes rápidos', descricao: '120 BPM', detalhe: 'Um bip a cada meio segundo.' },
];

type ResultadoCompleto = PosicaoEstudo & {
  resultado_ms: number; erro_ms: number; erro_absoluto_ms: number; erro_relativo_percentual: number;
};

function possuiResultado(t: PosicaoEstudo): t is ResultadoCompleto {
  return t.concluida && [t.resultado_ms, t.erro_ms, t.erro_absoluto_ms, t.erro_relativo_percentual]
    .every(valor => typeof valor === 'number' && Number.isFinite(valor));
}

function mediaDesvio(tentativas: ResultadoCompleto[]) {
  return tentativas.length ? formatarSegundos(tentativas.reduce((soma, t) => soma + t.erro_absoluto_ms, 0) / tentativas.length) : '—';
}

function IconeCondicao({ condicao }: { condicao: CondicaoEstudo }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0">
    {condicao === 'SEM_ESTIMULO' ? <><path d="M10 5 5 9H2v6h3l5 4V5Z" /><path d="m16 9 5 6m0-6-5 6" /></>
      : condicao === 'LENTO' ? <><path d="M5 10v4m7-8v12m7-8v4" /></>
        : <><path d="M3 10v4m4-7v10m5-13v16m5-13v10m4-7v4" /></>}
  </svg>;
}

function CartaoEstimativa({ tentativa: t, mostrarRepeticao }: { tentativa: ResultadoCompleto; mostrarRepeticao: boolean }) {
  const situacao = t.erro_ms < 0 ? 'Antes do alvo' : t.erro_ms > 0 ? 'Depois do alvo' : 'No alvo';
  const estilo = t.erro_ms < 0 ? 'bg-blue-50 text-blue-800' : t.erro_ms > 0 ? 'bg-amber-50 text-amber-900' : 'bg-destaque-claro text-principal';
  const escala = Math.max(t.tempo_alvo_ms, t.resultado_ms);
  const relativo = t.erro_relativo_percentual.toLocaleString('pt-BR', { maximumFractionDigits: 3, signDisplay: 'exceptZero' });
  return <article aria-label={`Alvo de ${t.tempo_alvo_ms / 1000} segundos${mostrarRepeticao ? `, repetição ${t.repeticao}` : ''}`} className="min-w-0 rounded-2xl border border-destaque-claro bg-branco p-5 lg:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3 md:flex-col md:items-start lg:flex-row lg:items-center">
      <h4 className="font-semibold text-principal">Alvo de {t.tempo_alvo_ms / 1000} s</h4>
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${estilo}`}>
        <span aria-hidden="true">{t.erro_ms < 0 ? '↘' : t.erro_ms > 0 ? '↗' : '='}</span>{situacao}
      </span>
    </div>
    <div className="mt-6 mb-5">
      <p className="text-xs font-medium uppercase tracking-wider text-texto-secundario">Sua estimativa</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-principal tabular-nums lg:text-4xl">{formatarSegundos(t.resultado_ms)}</p>
      <p className="mt-2 min-h-10 text-sm leading-5 text-texto-secundario">
        {t.erro_ms === 0 ? 'Você finalizou exatamente no tempo-alvo.'
          : <>{formatarErroAbsoluto(t.erro_absoluto_ms)} {t.erro_ms < 0 ? 'antes' : 'depois'} do alvo</>}
      </p>
    </div>
    <div aria-hidden="true" className="space-y-2.5 rounded-xl bg-fundo p-3">
      <div className="flex items-center gap-3"><span className="w-9 shrink-0 text-xs text-texto-secundario">Alvo</span><div className="h-2 flex-1 rounded-full bg-destaque-claro/50"><div className="h-2 rounded-full bg-borda-controle" style={{ width: `${t.tempo_alvo_ms / escala * 100}%` }} /></div></div>
      <div className="flex items-center gap-3"><span className="w-9 shrink-0 text-xs text-texto-secundario">Você</span><div className="h-2 flex-1 rounded-full bg-destaque-claro/50"><div className="h-2 rounded-full bg-destaque" style={{ width: `${t.resultado_ms / escala * 100}%` }} /></div></div>
    </div>
    <details className="group mt-4 border-t border-destaque-claro pt-2">
      <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-2 text-sm font-medium text-principal">
        Ver detalhes<span aria-hidden="true" className="text-lg group-open:hidden">＋</span><span aria-hidden="true" className="hidden text-lg group-open:inline">−</span>
      </summary>
      <dl className="space-y-3 pb-1 pt-2 text-sm">
        <div className="flex items-baseline justify-between gap-3"><dt className="text-texto-secundario">Erro assinado</dt><dd className="font-medium tabular-nums">{formatarErro(t.erro_ms)}</dd></div>
        <div className="flex items-baseline justify-between gap-3"><dt className="text-texto-secundario">Erro absoluto</dt><dd className="font-medium tabular-nums">{formatarErroAbsoluto(t.erro_absoluto_ms)}</dd></div>
        <div className="flex items-baseline justify-between gap-3"><dt className="text-texto-secundario">Erro relativo</dt><dd className="font-medium tabular-nums">{relativo}%</dd></div>
        <div className="flex items-baseline justify-between gap-3"><dt className="text-texto-secundario">Ordem na sessão</dt><dd>{t.ordem}ª tentativa</dd></div>
        {mostrarRepeticao && <div className="flex justify-between gap-3"><dt className="text-texto-secundario">Repetição</dt><dd>{t.repeticao}</dd></div>}
      </dl>
    </details>
  </article>;
}

export function ResultadosEstudo({ sessao }: { sessao: SessaoEstudo }) {
  const [selecionada, selecionar] = useState<CondicaoEstudo>('SEM_ESTIMULO');
  const abas = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();
  // Mesmo fora do fluxo da página, nunca expor resultados de uma sessão aberta.
  if (sessao.situacao !== 'CONCLUIDA') return null;
  const resultados = sessao.tentativas.filter(possuiResultado);
  const condicao = CONDICOES.find(c => c.codigo === selecionada)!;
  const grupo = resultados.filter(t => t.condicao === selecionada)
    .sort((a, b) => a.tempo_alvo_ms - b.tempo_alvo_ms || a.ordem - b.ordem);
  const bloco = sessao.blocos.find(b => b.condicao === selecionada)?.posicao ?? grupo[0]?.bloco;
  const antecipadas = resultados.filter(t => t.erro_ms < 0).length;
  const tardias = resultados.filter(t => t.erro_ms > 0).length;
  const exatas = resultados.filter(t => t.erro_ms === 0).length;
  const possuiRepeticoes = new Set(grupo.map(t => t.tempo_alvo_ms)).size < grupo.length;

  return <section aria-labelledby={`${id}-titulo`} className="space-y-7 text-principal">
    <header className="flex items-start gap-4">
      <span aria-hidden="true" className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-destaque-claro text-xl">✓</span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-texto-secundario">Sessão finalizada</p>
        <h2 id={`${id}-titulo`} className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">As {sessao.total} tentativas foram concluídas</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-texto-secundario">Obrigado por participar. Explore cada condição para ver como suas estimativas se aproximaram dos tempos-alvo.</p>
      </div>
    </header>

    <dl aria-label="Resumo da sessão" className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:gap-4">
      <div className="col-span-2 rounded-2xl bg-principal p-5 text-branco md:col-span-1 lg:p-6">
        <dt className="text-sm text-destaque-claro">Desvio médio da sessão</dt><dd><span className="mt-2 block text-3xl font-semibold tabular-nums">{mediaDesvio(resultados)}</span>
        <span className="mt-2 block text-xs leading-relaxed text-destaque-claro">Distância média até o alvo, considerando as {resultados.length} estimativas.{exatas > 0 && ` ${exatas} ${exatas === 1 ? 'parada exata' : 'paradas exatas'}.`}</span></dd>
      </div>
      <div className="rounded-2xl border border-destaque-claro bg-branco p-5 lg:p-6"><dt className="text-sm text-texto-secundario">Antes do alvo</dt><dd><span className="mt-2 block text-3xl font-semibold tabular-nums">{antecipadas}<span className="ml-1 text-sm font-normal text-texto-secundario">de {resultados.length}</span></span><span className="mt-2 block text-xs text-texto-secundario">Paradas antecipadas</span></dd></div>
      <div className="rounded-2xl border border-destaque-claro bg-branco p-5 lg:p-6"><dt className="text-sm text-texto-secundario">Depois do alvo</dt><dd><span className="mt-2 block text-3xl font-semibold tabular-nums">{tardias}<span className="ml-1 text-sm font-normal text-texto-secundario">de {resultados.length}</span></span><span className="mt-2 block text-xs text-texto-secundario">Paradas tardias</span></dd></div>
    </dl>

    <div className="space-y-4">
      <div><h3 className="text-lg font-semibold">Compare por tipo de estímulo</h3><p className="mt-1 text-sm text-texto-secundario">Selecione uma condição. Os resultados estão organizados pelo tempo-alvo.</p></div>
      <div role="tablist" aria-label="Condição dos resultados" className="grid grid-cols-3 gap-1.5 rounded-2xl border border-destaque-claro bg-branco p-1.5 sm:gap-2 sm:p-2">
        {CONDICOES.map((c, indice) => <button key={c.codigo} type="button" role="tab" id={`${id}-aba-${c.codigo}`} aria-controls={`${id}-painel-${c.codigo}`} aria-selected={selecionada === c.codigo} tabIndex={selecionada === c.codigo ? 0 : -1}
          ref={elemento => { abas.current[indice] = elemento; }} onClick={() => selecionar(c.codigo)}
          onKeyDown={evento => {
            const direcao = evento.key === 'ArrowRight' ? 1 : evento.key === 'ArrowLeft' ? -1 : 0;
            const destino = evento.key === 'Home' ? 0 : evento.key === 'End' ? CONDICOES.length - 1 : direcao ? (indice + direcao + CONDICOES.length) % CONDICOES.length : null;
            if (destino === null) return;
            evento.preventDefault(); selecionar(CONDICOES[destino].codigo); abas.current[destino]?.focus();
          }}
          className={`flex min-h-20 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-2 py-3 text-center transition-colors sm:min-h-18 sm:flex-row sm:gap-3 sm:px-4 ${selecionada === c.codigo ? 'bg-principal text-branco' : 'text-principal hover:bg-fundo'}`}>
          <span className="hidden sm:block"><IconeCondicao condicao={c.codigo} /></span>
          <span><span className="block text-xs font-semibold sm:text-sm">{c.titulo}</span><span className={`mt-0.5 block text-xs ${selecionada === c.codigo ? 'text-destaque-claro' : 'text-texto-secundario'}`}>{c.descricao}</span></span>
        </button>)}
      </div>

      {CONDICOES.map(c => <div key={c.codigo} role="tabpanel" id={`${id}-painel-${c.codigo}`} aria-labelledby={`${id}-aba-${c.codigo}`} hidden={selecionada !== c.codigo} tabIndex={0}>
        {selecionada === c.codigo && <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-2">
            <div><p className="text-sm font-semibold">{condicao.detalhe}</p><p className="mt-1 text-xs text-texto-secundario">{bloco ? `Bloco ${bloco} · ` : ''}{grupo.length} {grupo.length === 1 ? 'tentativa' : 'tentativas'}</p></div>
            <p className="text-xs text-texto-secundario">Desvio médio do bloco <span className="ml-1 font-semibold text-principal tabular-nums">{mediaDesvio(grupo)}</span></p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">{grupo.map(t => <CartaoEstimativa key={t.id} tentativa={t} mostrarRepeticao={possuiRepeticoes} />)}</div>
          {!grupo.length && <p className="rounded-xl bg-branco p-5 text-sm text-texto-secundario">Nenhum resultado disponível para esta condição.</p>}
        </div>}
      </div>)}
    </div>

    <details className="group rounded-2xl border border-destaque-claro bg-branco px-5 py-2">
      <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-3 text-sm font-medium">Como interpretar estes resultados<span aria-hidden="true" className="group-open:hidden">＋</span><span aria-hidden="true" className="hidden group-open:inline">−</span></summary>
      <div className="space-y-3 pb-4 pt-2 text-sm leading-relaxed text-texto-secundario">
        <p><strong className="text-principal">Antes do alvo:</strong> parada antecipada, compatível com superestimação da duração transcorrida. <strong className="text-principal">Depois do alvo:</strong> parada tardia, compatível com subestimação.</p>
        <p><strong className="text-principal">Desvio médio:</strong> média dos erros absolutos. Quanto menor, mais perto dos tempos-alvo ficaram as estimativas. Os valores exibidos são arredondados apenas para leitura.</p>
        <p>O estudo compara estimativas em silêncio e com dois ritmos de bipes. Diferenças nas respostas não medem diretamente atenção ou concentração e não comprovam, por si, um efeito de nudge.</p>
      </div>
    </details>
  </section>;
}

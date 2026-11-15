import { useMemo, useState } from 'react';
import type { AnaliseQuestionariosEstudo } from '../tipos/administracao';
import type { CondicaoEstudo } from '../servicos/estudo';
import { rotularCondicaoEstudo } from '../servicos/estudo';

const ALVOS = [5000, 10000, 15000];
const CONDICOES: CondicaoEstudo[] = ['SEM_ESTIMULO', 'LENTO', 'RAPIDO'];
const NOTAS: (number | null)[] = [1, 2, 3, 4, 5, 6, 7, null];
const ROTULOS_ESTRATEGIA: Record<string, string> = {
  SEM_CONTAGEM: 'Sem contagem',
  CONTAGEM_MENTAL: 'Contagem mental',
  CONTAGEM_BIPES: 'Contagem dos bipes',
  COMBINADA: 'Estratégia combinada',
  OUTRA: 'Outra estratégia',
  PREFERIU_NAO_RESPONDER: 'Preferiu não responder',
};

const formatarSegundos = (valor: number | null) => valor === null
  ? 'Sem dados'
  : `${(valor / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} s`;

function BarraQuantidade({ quantidade, maximo }: { quantidade: number; maximo: number }) {
  return <span className="inline-flex w-full items-center gap-2">
    <span className="h-2 rounded-full bg-destaque" style={{ width: `${quantidade > 0 && maximo ? Math.max(6, 100 * quantidade / maximo) : 0}%` }} aria-hidden="true" />
    <span>{quantidade}</span>
  </span>;
}

export function QuestionariosAnaliseEstudo({ dados }: { dados: AnaliseQuestionariosEstudo }) {
  const [condicaoConfianca, definirCondicaoConfianca] = useState<CondicaoEstudo>('SEM_ESTIMULO');
  const [alvoConfianca, definirAlvoConfianca] = useState(10000);
  const [medidaBloco, definirMedidaBloco] = useState<'AGRADABILIDADE' | 'ANSIEDADE'>('AGRADABILIDADE');
  const [condicaoBloco, definirCondicaoBloco] = useState<CondicaoEstudo>('LENTO');
  const [estrategia, definirEstrategia] = useState(dados.estrategias[0]?.categoria ?? '');
  const [alvoEstrategia, definirAlvoEstrategia] = useState(10000);
  const [condicaoEstrategia, definirCondicaoEstrategia] = useState<'LENTO' | 'RAPIDO'>('RAPIDO');
  const [metricaEstrategia, definirMetricaEstrategia] = useState<'ASSINADO' | 'ABSOLUTO'>('ASSINADO');

  const confianca = useMemo(() => dados.confianca.filter(item =>
    item.condicao === condicaoConfianca && item.tempo_alvo_ms === alvoConfianca
  ), [alvoConfianca, condicaoConfianca, dados.confianca]);
  const respostasBloco = useMemo(() => dados.respostas_por_bloco.filter(item =>
    item.medida === medidaBloco && item.condicao === condicaoBloco
  ), [condicaoBloco, dados.respostas_por_bloco, medidaBloco]);
  const resumoBloco = dados.resumos_blocos.find(item => item.medida === medidaBloco && item.condicao === condicaoBloco);
  const comparacao = dados.comparacoes_por_estrategia.find(item =>
    item.estrategia === estrategia && item.tempo_alvo_ms === alvoEstrategia && item.condicao === condicaoEstrategia
  );
  const maxConfianca = Math.max(0, ...confianca.map(item => item.tentativas));
  const maxBloco = Math.max(0, ...respostasBloco.map(item => item.respostas));
  const diferencaEstrategia = metricaEstrategia === 'ASSINADO'
    ? comparacao?.diferenca_erro_assinado_media_ms
    : comparacao?.diferenca_erro_absoluto_media_ms;

  return <section aria-labelledby="titulo-questionarios-analise" className="rounded-2xl border border-destaque-claro bg-branco p-5 space-y-7">
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-texto-secundario">Pesquisa subjetiva</p>
      <h3 id="titulo-questionarios-analise" className="mt-1 text-lg font-semibold">Questionários e interpretação da experiência</h3>
      <p className="mt-1 text-sm text-texto-secundario">As respostas de bloco contam uma vez por participante e condição, sem repetição pelas três tentativas.</p>
    </div>

    <section aria-labelledby="titulo-confianca" className="space-y-4">
      <div><h4 id="titulo-confianca" className="font-semibold">Confiança versus precisão</h4><p className="text-sm text-texto-secundario">Mediana do erro absoluto para cada nota de confiança.</p></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Condição<select value={condicaoConfianca} onChange={evento => definirCondicaoConfianca(evento.target.value as CondicaoEstudo)} className="mt-1 block min-h-11 w-full rounded-xl border border-borda-controle bg-branco px-3">{CONDICOES.map(item => <option value={item} key={item}>{rotularCondicaoEstudo(item)}</option>)}</select></label>
        <label className="text-sm font-medium">Tempo-alvo<select value={alvoConfianca} onChange={evento => definirAlvoConfianca(Number(evento.target.value))} className="mt-1 block min-h-11 w-full rounded-xl border border-borda-controle bg-branco px-3">{ALVOS.map(item => <option value={item} key={item}>{item / 1000} segundos</option>)}</select></label>
      </div>
      <div className="overflow-x-auto rounded-xl border border-destaque-claro"><table className="w-full min-w-[620px] text-sm"><caption className="sr-only">Confiança e precisão por nota</caption><thead><tr className="bg-destaque-claro/50"><th className="p-3 text-left" scope="col">Nota</th><th className="p-3 text-left" scope="col">Tentativas</th><th className="p-3 text-left" scope="col">Participantes</th><th className="p-3 text-left" scope="col">Erro absoluto mediano</th></tr></thead><tbody>{NOTAS.map(nota => {
        const item = confianca.find(valor => valor.nota === nota);
        return <tr className="border-t border-destaque-claro" key={nota ?? 'recusa'}><th scope="row" className="p-3 text-left">{nota ?? 'Preferiu não responder'}</th><td className="p-3"><BarraQuantidade quantidade={item?.tentativas ?? 0} maximo={maxConfianca} /></td><td className="p-3">{item?.participantes ?? 0}</td><td className="p-3">{formatarSegundos(item?.erro_absoluto_mediano_ms ?? null)}</td></tr>;
      })}</tbody></table></div>
    </section>

    <section aria-labelledby="titulo-blocos" className="space-y-4 border-t border-destaque-claro pt-6">
      <div><h4 id="titulo-blocos" className="font-semibold">Experiência por bloco</h4><p className="text-sm text-texto-secundario">Uma resposta por bloco e condição.</p></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Medida<select value={medidaBloco} onChange={evento => definirMedidaBloco(evento.target.value as 'AGRADABILIDADE' | 'ANSIEDADE')} className="mt-1 block min-h-11 w-full rounded-xl border border-borda-controle bg-branco px-3"><option value="AGRADABILIDADE">Agradabilidade</option><option value="ANSIEDADE">Ansiedade</option></select></label>
        <label className="text-sm font-medium">Condição<select value={condicaoBloco} onChange={evento => definirCondicaoBloco(evento.target.value as CondicaoEstudo)} className="mt-1 block min-h-11 w-full rounded-xl border border-borda-controle bg-branco px-3">{CONDICOES.map(item => <option value={item} key={item}>{rotularCondicaoEstudo(item)}</option>)}</select></label>
      </div>
      <p className="rounded-xl bg-fundo p-3 text-sm">Mediana: <strong>{resumoBloco?.mediana?.toLocaleString('pt-BR') ?? 'sem respostas válidas'}</strong> · {resumoBloco?.respostas_validas ?? 0} respostas válidas · {resumoBloco?.recusas ?? 0} recusas</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{NOTAS.map(nota => {
        const item = respostasBloco.find(valor => valor.nota === nota);
        return <div key={nota ?? 'recusa'} className="rounded-xl border border-destaque-claro p-3"><p className="text-xs text-texto-secundario">{nota === null ? 'Recusa' : `Nota ${nota}`}</p><div className="mt-2 text-sm"><BarraQuantidade quantidade={item?.respostas ?? 0} maximo={maxBloco} /></div></div>;
      })}</div>
    </section>

    <section aria-labelledby="titulo-estrategias" className="space-y-4 border-t border-destaque-claro pt-6">
      <div><h4 id="titulo-estrategias" className="font-semibold">Estratégia declarada</h4><p className="text-sm text-texto-secundario">Característica declarada ao final da sessão; não representa causalidade.</p></div>
      {dados.estrategias.length === 0 ? <p className="text-sm text-texto-secundario">Ainda não há respostas finais.</p> : <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{dados.estrategias.map(item => <div key={item.categoria} className="rounded-xl border border-destaque-claro p-3"><p className="font-medium">{ROTULOS_ESTRATEGIA[item.categoria] ?? item.categoria}</p><p className="mt-1 text-sm text-texto-secundario">{item.participantes} participantes · {item.percentual.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</p></div>)}</div>}
      {dados.estrategias.length > 0 && <div className="rounded-xl bg-fundo p-4 space-y-3">
        <p className="font-medium">Comparação exploratória dentro da estratégia</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm">Estratégia<select value={estrategia} onChange={evento => definirEstrategia(evento.target.value)} className="mt-1 block min-h-11 w-full rounded-xl border border-borda-controle bg-branco px-3">{dados.estrategias.map(item => <option value={item.categoria} key={item.categoria}>{ROTULOS_ESTRATEGIA[item.categoria] ?? item.categoria}</option>)}</select></label>
          <label className="text-sm">Condição<select value={condicaoEstrategia} onChange={evento => definirCondicaoEstrategia(evento.target.value as 'LENTO' | 'RAPIDO')} className="mt-1 block min-h-11 w-full rounded-xl border border-borda-controle bg-branco px-3"><option value="LENTO">Lentos × silêncio</option><option value="RAPIDO">Rápidos × silêncio</option></select></label>
          <label className="text-sm">Alvo<select value={alvoEstrategia} onChange={evento => definirAlvoEstrategia(Number(evento.target.value))} className="mt-1 block min-h-11 w-full rounded-xl border border-borda-controle bg-branco px-3">{ALVOS.map(item => <option value={item} key={item}>{item / 1000} s</option>)}</select></label>
          <label className="text-sm">Medida<select value={metricaEstrategia} onChange={evento => definirMetricaEstrategia(evento.target.value as 'ASSINADO' | 'ABSOLUTO')} className="mt-1 block min-h-11 w-full rounded-xl border border-borda-controle bg-branco px-3"><option value="ASSINADO">Erro assinado</option><option value="ABSOLUTO">Erro absoluto</option></select></label>
        </div>
        <p className="text-sm"><strong>{comparacao?.pares ?? 0} pares:</strong> {diferencaEstrategia === null || diferencaEstrategia === undefined ? 'sem dados suficientes' : `${diferencaEstrategia > 0 ? '+' : diferencaEstrategia < 0 ? '−' : ''}${formatarSegundos(Math.abs(diferencaEstrategia))} em relação ao silêncio`}.</p>
      </div>}
    </section>
  </section>;
}

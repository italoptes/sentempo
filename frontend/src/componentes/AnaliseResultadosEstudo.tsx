import { useMemo, useState } from 'react';
import type {
  AnaliseEstudo,
  ComparacaoPareadaEstudo,
  ResultadoAnaliseEstudo,
} from '../tipos/administracao';
import type { CondicaoEstudo } from '../servicos/estudo';
import { rotularCondicaoEstudo } from '../servicos/estudo';

type Metrica = 'ERRO_ASSINADO' | 'ERRO_ABSOLUTO' | 'ERRO_RELATIVO';

const CONDICOES: CondicaoEstudo[] = ['SEM_ESTIMULO', 'LENTO', 'RAPIDO'];
const ALVOS = [5000, 10000, 15000];
const CORES: Record<CondicaoEstudo, string> = {
  SEM_ESTIMULO: '#4B5563',
  LENTO: '#00796B',
  RAPIDO: '#B45309',
};
const ROTULOS_METRICA: Record<Metrica, string> = {
  ERRO_ASSINADO: 'Erro assinado médio',
  ERRO_ABSOLUTO: 'Erro absoluto médio',
  ERRO_RELATIVO: 'Erro relativo médio',
};

function valorResultado(item: ResultadoAnaliseEstudo, metrica: Metrica): number | null {
  if (metrica === 'ERRO_ASSINADO') return item.erro_assinado_medio_ms;
  if (metrica === 'ERRO_ABSOLUTO') return item.erro_absoluto_medio_ms;
  return item.erro_relativo_medio_percentual;
}

function valorComparacao(item: ComparacaoPareadaEstudo, metrica: Metrica): number | null {
  if (metrica === 'ERRO_ASSINADO') return item.diferenca_erro_assinado_media_ms;
  if (metrica === 'ERRO_ABSOLUTO') return item.diferenca_erro_absoluto_media_ms;
  return item.diferenca_erro_relativo_media_pp;
}

function formatarDecimal(valor: number, casas = 3): string {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

function formatarMedida(valor: number | null, metrica: Metrica): string {
  if (valor === null) return 'Sem observações';
  if (metrica === 'ERRO_ABSOLUTO') return `${formatarDecimal(valor / 1000)} s`;
  const sinal = valor > 0 ? '+' : valor < 0 ? '−' : '';
  const unidade = metrica === 'ERRO_RELATIVO' ? '%' : ' s';
  const base = metrica === 'ERRO_RELATIVO' ? Math.abs(valor) : Math.abs(valor) / 1000;
  return `${sinal}${formatarDecimal(base)}${unidade}`;
}

function resumoComparacao(comparacao: ComparacaoPareadaEstudo | undefined, metrica: Metrica): string {
  if (!comparacao || comparacao.pares === 0) return 'Sem pares para esta comparação.';
  const valor = valorComparacao(comparacao, metrica);
  if (valor === null) return 'Sem pares para esta comparação.';
  const magnitude = metrica === 'ERRO_RELATIVO'
    ? `${formatarDecimal(Math.abs(valor))} pontos percentuais`
    : `${formatarDecimal(Math.abs(valor) / 1000)} s`;
  if (valor === 0) {
    return metrica === 'ERRO_ABSOLUTO'
      ? 'A distância média até o alvo foi igual à observada no silêncio.'
      : 'A diferença média em relação ao silêncio foi zero.';
  }
  if (metrica === 'ERRO_ABSOLUTO') {
    return `${magnitude} ${valor < 0 ? 'mais perto' : 'mais longe'} do alvo que no silêncio.`;
  }
  return `${magnitude} ${valor < 0 ? 'mais cedo' : 'mais tarde'} que no silêncio.`;
}

function GraficoResultados({ resultados, metrica }: { resultados: ResultadoAnaliseEstudo[]; metrica: Metrica }) {
  const largura = 900;
  const topo = 30;
  const base = 275;
  const altura = base - topo;
  const centros = [160, 450, 740];
  const valores = resultados.map(item => valorResultado(item, metrica)).filter((valor): valor is number => valor !== null);
  const assinado = metrica !== 'ERRO_ABSOLUTO';
  const maximo = Math.max(1, ...valores.map(valor => Math.abs(valor)));
  const zeroY = assinado ? topo + altura / 2 : base;
  const escala = assinado ? (altura / 2 - 8) / maximo : (altura - 8) / maximo;
  const titulo = `${ROTULOS_METRICA[metrica]} por condição e alvo`;

  return (
    <div className="overflow-x-auto" data-testid="grafico-resultados-estudo">
      <svg viewBox={`0 0 ${largura} 360`} className="min-w-[760px] w-full" role="img" aria-labelledby="titulo-grafico-estudo descricao-grafico-estudo">
        <title id="titulo-grafico-estudo">{titulo}</title>
        <desc id="descricao-grafico-estudo">Três grupos de barras para os alvos de 5, 10 e 15 segundos. Cada grupo compara silêncio, bipes lentos e bipes rápidos.</desc>
        <line x1="55" x2="855" y1={zeroY} y2={zeroY} stroke="#5F7775" strokeWidth="1.5" />
        {assinado && <text x="48" y={zeroY + 4} textAnchor="end" fontSize="12" fill="#4B5563">0</text>}
        {ALVOS.map((alvo, indiceAlvo) => (
          <g key={alvo}>
            {CONDICOES.map((condicao, indiceCondicao) => {
              const item = resultados.find(resultado => resultado.tempo_alvo_ms === alvo && resultado.condicao === condicao);
              const valor = item ? valorResultado(item, metrica) : null;
              const x = centros[indiceAlvo] + (indiceCondicao - 1) * 62 - 20;
              if (valor === null) {
                return <text key={condicao} x={x + 20} y={zeroY - 7} textAnchor="middle" fontSize="18" fill="#6B7280">—</text>;
              }
              const alturaBarra = Math.abs(valor) * escala;
              const y = valor >= 0 ? zeroY - alturaBarra : zeroY;
              return (
                <g key={condicao}>
                  <rect x={x} y={y} width="40" height={Math.max(alturaBarra, valor === 0 ? 2 : 0)} rx="4" fill={CORES[condicao]}>
                    <title>{rotularCondicaoEstudo(condicao)}, alvo {alvo / 1000} s: {formatarMedida(valor, metrica)}; {item?.participantes ?? 0} participantes</title>
                  </rect>
                </g>
              );
            })}
            <text x={centros[indiceAlvo]} y="307" textAnchor="middle" fontSize="14" fontWeight="600" fill="#0F2D2E">{alvo / 1000} s</text>
          </g>
        ))}
        {CONDICOES.map((condicao, indice) => (
          <g key={condicao} transform={`translate(${190 + indice * 220}, 338)`}>
            <rect width="14" height="14" rx="3" fill={CORES[condicao]} />
            <text x="21" y="12" fontSize="12" fill="#0F2D2E">{rotularCondicaoEstudo(condicao)}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function AnaliseResultadosEstudo({ analise }: { analise: AnaliseEstudo }) {
  const [metrica, definirMetrica] = useState<Metrica>('ERRO_ASSINADO');
  const [alvoComparacao, definirAlvoComparacao] = useState(10000);
  const [condicaoComparacao, definirCondicaoComparacao] = useState<'LENTO' | 'RAPIDO'>('RAPIDO');
  const comparacao = useMemo(
    () => analise.comparacoes.find(item => item.tempo_alvo_ms === alvoComparacao && item.condicao === condicaoComparacao),
    [analise.comparacoes, alvoComparacao, condicaoComparacao],
  );

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-destaque-claro bg-branco p-5">
        <p className="text-sm font-medium text-texto-secundario">Recorte analisado</p>
        <h2 className="mt-1 text-xl font-semibold">Estudo A · V2 · Sessões concluídas · {analise.participantes} {analise.participantes === 1 ? 'participante' : 'participantes'}</h2>
        <p className="mt-2 text-sm text-texto-secundario">Cada pessoa contribui com uma observação por condição e alvo. Sessões em andamento ficam fora destes resultados.</p>
      </header>

      <section aria-labelledby="titulo-resultado-principal" className="rounded-2xl border border-destaque-claro bg-branco p-5 space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-texto-secundario">Resultado principal</p>
          <h3 id="titulo-resultado-principal" className="mt-1 text-lg font-semibold">Condições por tempo-alvo</h3>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Medida exibida</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {(Object.keys(ROTULOS_METRICA) as Metrica[]).map(item => (
              <button key={item} type="button" aria-pressed={metrica === item} onClick={() => definirMetrica(item)}
                className={`min-h-11 rounded-xl border px-3 text-sm font-medium transition-colors ${metrica === item ? 'border-principal bg-principal text-branco' : 'border-borda-controle bg-branco hover:bg-fundo'}`}>
                {ROTULOS_METRICA[item]}
              </button>
            ))}
          </div>
        </fieldset>
        {analise.participantes === 0 ? (
          <p className="rounded-xl bg-fundo p-4 text-sm text-texto-secundario">Ainda não há sessões concluídas para esta análise. As sessões iniciadas continuam disponíveis na área de acompanhamento abaixo.</p>
        ) : (
          <GraficoResultados resultados={analise.resultados} metrica={metrica} />
        )}
        <div className="overflow-x-auto rounded-xl border border-destaque-claro">
          <table className="w-full min-w-[680px] text-sm whitespace-nowrap">
            <caption className="sr-only">{ROTULOS_METRICA[metrica]} por condição e tempo-alvo</caption>
            <thead><tr className="bg-destaque-claro/50"><th scope="col" className="p-3 text-left">Alvo</th>{CONDICOES.map(condicao => <th scope="col" className="p-3 text-left" key={condicao}>{rotularCondicaoEstudo(condicao)}</th>)}</tr></thead>
            <tbody>{ALVOS.map(alvo => <tr key={alvo} className="border-t border-destaque-claro">
              <th scope="row" className="p-3 text-left">{alvo / 1000} s</th>
              {CONDICOES.map(condicao => {
                const item = analise.resultados.find(resultado => resultado.tempo_alvo_ms === alvo && resultado.condicao === condicao);
                const valor = item ? valorResultado(item, metrica) : null;
                return <td className="p-3" key={condicao}><span className="font-medium">{formatarMedida(valor, metrica)}</span><span className="ml-2 text-xs text-texto-secundario">n = {item?.participantes ?? 0}</span></td>;
              })}
            </tr>)}</tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="titulo-comparacao-pareada" className="rounded-2xl border border-destaque-claro bg-branco p-5 space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-texto-secundario">Comparação prioritária</p>
          <h3 id="titulo-comparacao-pareada" className="mt-1 text-lg font-semibold">Comparação pareada com o silêncio</h3>
          <p className="mt-1 text-sm text-texto-secundario">Somente pessoas com os dois resultados válidos entram no cálculo.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">Condição
            <select value={condicaoComparacao} onChange={evento => definirCondicaoComparacao(evento.target.value as 'LENTO' | 'RAPIDO')} className="mt-1 block min-h-11 w-full rounded-xl border border-borda-controle bg-branco px-3">
              <option value="LENTO">Bipes lentos × silêncio</option>
              <option value="RAPIDO">Bipes rápidos × silêncio</option>
            </select>
          </label>
          <label className="text-sm font-medium">Tempo-alvo
            <select value={alvoComparacao} onChange={evento => definirAlvoComparacao(Number(evento.target.value))} className="mt-1 block min-h-11 w-full rounded-xl border border-borda-controle bg-branco px-3">
              {ALVOS.map(alvo => <option value={alvo} key={alvo}>{alvo / 1000} segundos</option>)}
            </select>
          </label>
        </div>
        <div className="rounded-xl bg-fundo p-5" aria-live="polite">
          <p className="text-sm text-texto-secundario">{ROTULOS_METRICA[metrica]} · {comparacao?.pares ?? 0} {(comparacao?.pares ?? 0) === 1 ? 'par válido' : 'pares válidos'}</p>
          <p className="mt-2 text-lg font-semibold">{resumoComparacao(comparacao, metrica)}</p>
          {comparacao && comparacao.pares > 0 && <p className="mt-3 text-sm text-texto-secundario">Diferença individual de tempo: {comparacao.mais_cedo} mais cedo · {comparacao.mais_tarde} mais tarde · {comparacao.mesmo_tempo} no mesmo tempo.</p>}
        </div>
      </section>
    </div>
  );
}

// componentes/TabelaResultados.tsx — Tabela de tentativas concluídas

import type { Tentativa } from '../tipos/participante';
import { formatarSegundos, formatarErro, formatarErroAbsoluto, rotularTempo, rotularCondicao } from '../utilitarios/formatacao';

interface Props {
  tentativas: Tentativa[];
  onExcluir?: (id: string) => void;
  mostrarCabecalhosTempo?: boolean;
}

function CabecalhoGrupo({ tempo }: { tempo: number }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-principal">
      <svg
        aria-hidden="true"
        className="h-5 w-5 flex-none text-destaque"
        viewBox="0 0 20 20"
        fill="none"
      >
        <path d="M4 2v12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m12.5 9.5 3.5 4.5-4.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>Alvo de {rotularTempo(tempo)}</span>
    </h3>
  );
}

export function TabelaResultados({
  tentativas,
  onExcluir,
  mostrarCabecalhosTempo = true,
}: Props) {
  if (tentativas.length === 0) {
    return (
      <p className="text-texto-secundario text-sm italic text-center py-4">
        Nenhuma tentativa concluída ainda.
      </p>
    );
  }

  const gruposPorTempo = Array.from(
    tentativas.reduce((grupos, tentativa) => {
      const grupo = grupos.get(tentativa.tempo_alvo_ms) ?? [];
      grupo.push(tentativa);
      grupos.set(tentativa.tempo_alvo_ms, grupo);
      return grupos;
    }, new Map<number, Tentativa[]>()),
  ).sort(([tempoA], [tempoB]) => tempoA - tempoB);

  return (
    <div className="space-y-4">
      {/* Visão de Cards para Celular */}
      <div className="space-y-5 md:hidden">
        {gruposPorTempo.map(([tempo, tentativasDoTempo]) => (
          <section key={tempo} aria-label={`Resultados de ${rotularTempo(tempo)}`}>
            {mostrarCabecalhosTempo && (
              <CabecalhoGrupo tempo={tempo} />
            )}
            <div className="grid grid-cols-1 gap-3">
              {tentativasDoTempo.map((t) => (
                <article
                  key={t.id}
                  aria-label={`Tentativa na condição ${rotularCondicao(t.condicao)}`}
                  className="overflow-hidden rounded-xl border border-destaque-claro bg-branco shadow-sm"
                >
                  <div className="flex min-h-16 items-center gap-3 border-b border-destaque-claro bg-fundo px-4 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-texto-secundario">
                        Condição
                      </p>
                      <p className="font-semibold leading-snug text-principal">
                        {rotularCondicao(t.condicao)}
                      </p>
                    </div>
                    {onExcluir && (
                      <button
                        type="button"
                        aria-label={`Excluir tentativa de ${rotularTempo(t.tempo_alvo_ms)}, condição ${rotularCondicao(t.condicao)}`}
                        onClick={() => onExcluir(t.id)}
                        className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 transition-colors hover:bg-red-100 hover:text-red-700"
                      >
                        <span aria-hidden="true">✕</span>
                      </button>
                    )}
                  </div>

                  <dl className="space-y-2.5 px-4 py-3.5">
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="text-xs font-semibold uppercase text-texto-secundario">Resultado</dt>
                      <dd className="font-mono text-principal">{formatarSegundos(t.resultado_ms)}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="text-xs font-semibold uppercase text-texto-secundario">Erro</dt>
                      <dd className={`font-mono font-medium ${t.erro_ms < 0 ? 'text-blue-600' : t.erro_ms > 0 ? 'text-orange-600' : 'text-green-700'}`}>
                        {formatarErro(t.erro_ms)}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="text-xs font-semibold uppercase text-texto-secundario">Erro absoluto</dt>
                      <dd className="font-mono text-principal">{formatarErroAbsoluto(t.erro_absoluto_ms)}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Visão de Tabela para Desktop */}
      <div className="hidden space-y-5 md:block">
        {gruposPorTempo.map(([tempo, tentativasDoTempo]) => (
          <section key={tempo} aria-label={`Resultados de ${rotularTempo(tempo)}`}>
            {mostrarCabecalhosTempo && (
              <CabecalhoGrupo tempo={tempo} />
            )}
            <div className="overflow-x-auto rounded-xl border border-destaque-claro shadow-sm">
              <table className="w-full text-sm whitespace-nowrap" aria-label={`Resultados de ${rotularTempo(tempo)}`}>
                <thead>
                  <tr className="bg-destaque-claro text-principal">
                    <th scope="col" className="px-4 py-3 text-left font-semibold">Tempo</th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold">Condição</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Resultado</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Erro</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Erro Absoluto</th>
                    {onExcluir && <th scope="col" className="px-4 py-3 text-center font-semibold w-12">Ação</th>}
                  </tr>
                </thead>
                <tbody>
                  {tentativasDoTempo.map((t) => (
                    <tr key={t.id} className="border-t border-destaque-claro hover:bg-fundo transition-colors group">
                      <td className="px-4 py-3 text-left">{rotularTempo(t.tempo_alvo_ms)}</td>
                      <td className="px-4 py-3 text-left">{rotularCondicao(t.condicao)}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatarSegundos(t.resultado_ms)}</td>
                      <td className={`px-4 py-3 text-right font-mono ${t.erro_ms < 0 ? 'text-blue-600' : t.erro_ms > 0 ? 'text-orange-600' : 'text-green-700'}`}>
                        {formatarErro(t.erro_ms)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{formatarErroAbsoluto(t.erro_absoluto_ms)}</td>
                      {onExcluir && (
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            aria-label={`Excluir tentativa de ${rotularTempo(t.tempo_alvo_ms)}, condição ${rotularCondicao(t.condicao)}`}
                            onClick={() => onExcluir(t.id)}
                            className="inline-flex min-h-11 min-w-11 items-center justify-center text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity rounded hover:bg-red-50"
                          >
                            <span aria-hidden="true">✕</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

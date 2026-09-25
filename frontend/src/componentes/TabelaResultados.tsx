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
                <div key={t.id} className="bg-branco rounded-xl border border-destaque-claro p-4 relative space-y-2 shadow-sm">
                  {onExcluir && (
                    <button
                      type="button"
                      onClick={() => onExcluir(t.id)}
                      className="absolute top-3 right-3 text-red-400 hover:text-red-600 bg-red-50 p-1.5 rounded-full"
                      title="Excluir tentativa"
                    >
                      ✕
                    </button>
                  )}
                  <div className="flex justify-between items-center pr-8">
                    <span className="text-xs text-texto-secundario uppercase font-semibold">Tempo</span>
                    <span className="text-principal font-medium">{rotularTempo(t.tempo_alvo_ms)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-texto-secundario uppercase font-semibold">Condição</span>
                    <span className="text-principal font-medium">{rotularCondicao(t.condicao)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-texto-secundario uppercase font-semibold">Resultado</span>
                    <span className="text-principal font-mono">{formatarSegundos(t.resultado_ms)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-texto-secundario uppercase font-semibold">Erro</span>
                    <span className={`font-mono font-medium ${t.erro_ms < 0 ? 'text-blue-600' : t.erro_ms > 0 ? 'text-orange-600' : 'text-green-700'}`}>
                      {formatarErro(t.erro_ms)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-texto-secundario uppercase font-semibold">Erro Absoluto</span>
                    <span className="text-principal font-mono">{formatarErroAbsoluto(t.erro_absoluto_ms)}</span>
                  </div>
                </div>
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
                            onClick={() => onExcluir(t.id)}
                            className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50"
                            title="Excluir tentativa"
                          >
                            ✕
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

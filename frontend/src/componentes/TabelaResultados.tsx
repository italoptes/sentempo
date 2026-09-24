// componentes/TabelaResultados.tsx — Tabela de tentativas concluídas

import type { Tentativa } from '../tipos/participante';
import { formatarSegundos, formatarErro, formatarErroAbsoluto, rotularTempo, rotularCondicao } from '../utilitarios/formatacao';

interface Props {
  tentativas: Tentativa[];
  onExcluir?: (id: string) => void;
}

export function TabelaResultados({ tentativas, onExcluir }: Props) {
  if (tentativas.length === 0) {
    return (
      <p className="text-texto-secundario text-sm italic text-center py-4">
        Nenhuma tentativa concluída ainda.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-destaque-claro">
      <table className="w-full text-sm" aria-label="Resultados das tentativas">
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
          {tentativas.map((t) => (
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
  );
}

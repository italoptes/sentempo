// componentes/ResumoEstatisticas.tsx — Cards de resumo e tabela de estatísticas (área admin)

import type { EstatisticaItem, ResumoAdministracao } from '../tipos/administracao';

interface PropsResumo {
  resumo: ResumoAdministracao;
}

function CardMetrica({ titulo, valor, sub }: { titulo: string; valor: string; sub?: string }) {
  return (
    <div className="bg-branco rounded-xl border border-destaque-claro p-4">
      <p className="text-xs text-texto-secundario uppercase tracking-wide mb-1">{titulo}</p>
      <p className="text-2xl font-semibold text-principal">{valor}</p>
      {sub && <p className="text-xs text-texto-secundario mt-1">{sub}</p>}
    </div>
  );
}

export function ResumoEstatisticas({ resumo }: PropsResumo) {
  const tendencia = resumo.tendencia_geral;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <CardMetrica titulo="Participantes" valor={String(resumo.participantes_total)} />
        <CardMetrica titulo="Completos" valor={String(resumo.participantes_completos)} />
        <CardMetrica
          titulo="Tentativas válidas"
          valor={String(resumo.tentativas_validas_total)}
          sub={`de ${resumo.tentativas_esperadas} esperadas`}
        />
        <CardMetrica
          titulo="Taxa de conclusão"
          valor={`${resumo.taxa_conclusao_percentual.toFixed(1)}%`}
        />
        <CardMetrica
          titulo="Erro médio"
          valor={`${resumo.erro_medio_ms > 0 ? '+' : ''}${resumo.erro_medio_ms.toFixed(1)} ms`}
        />
        <CardMetrica
          titulo="Erro absoluto médio"
          valor={`${resumo.erro_absoluto_medio_ms.toFixed(1)} ms`}
        />
      </div>

      <div className="bg-branco rounded-xl border border-destaque-claro p-4">
        <p className="text-xs text-texto-secundario uppercase tracking-wide mb-3">Tendência geral</p>
        <div className="flex gap-6 flex-wrap">
          <div className="text-center">
            <p className="text-2xl font-semibold text-blue-600">{tendencia.abaixo}</p>
            <p className="text-xs text-texto-secundario mt-1">Abaixo</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-orange-600">{tendencia.acima}</p>
            <p className="text-xs text-texto-secundario mt-1">Acima</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-green-700">{tendencia.igual}</p>
            <p className="text-xs text-texto-secundario mt-1">Igual</p>
          </div>
          <div className="text-center ml-auto">
            <p className="text-lg font-semibold text-principal">{tendencia.predominante}</p>
            <p className="text-xs text-texto-secundario mt-1">Predominante</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PropsTabelaEstatisticas {
  titulo: string;
  itens: EstatisticaItem[];
}

export function TabelaEstatisticas({ titulo, itens }: PropsTabelaEstatisticas) {
  return (
    <div>
      {titulo && <h3 className="text-sm font-semibold text-texto-secundario uppercase tracking-wide mb-3">{titulo}</h3>}
      
      {/* Visão de Cards para Celular */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {itens.map((item) => (
          <div key={item.chave} className="bg-branco rounded-xl border border-destaque-claro p-4 space-y-2 shadow-sm">
            <div className="flex justify-between items-center pr-2">
              <span className="text-xs text-texto-secundario uppercase font-semibold">Grupo</span>
              <span className="text-principal font-semibold text-sm">{item.chave}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-texto-secundario uppercase font-semibold">Tentativas</span>
              <span className="text-principal text-sm">{item.quantidade_tentativas}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-texto-secundario uppercase font-semibold">Erro médio</span>
              <span className={`font-mono text-sm font-medium ${item.erro_medio_ms < 0 ? 'text-blue-600' : item.erro_medio_ms > 0 ? 'text-orange-600' : 'text-green-700'}`}>
                {item.erro_medio_ms > 0 ? '+' : ''}{item.erro_medio_ms.toFixed(1)} ms
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-texto-secundario uppercase font-semibold">Err. abs. médio</span>
              <span className="text-principal font-mono text-sm">{item.erro_absoluto_medio_ms.toFixed(1)} ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-texto-secundario uppercase font-semibold">Tendência</span>
              <span className="inline-flex items-center gap-1 text-xs">
                <span className="text-blue-600">↓{item.abaixo}</span>
                <span className="text-orange-600">↑{item.acima}</span>
                <span className="text-green-700">={item.igual}</span>
                <span className="ml-1 font-semibold text-principal">({item.tendencia_predominante})</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Visão de Tabela para Desktop */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-destaque-claro shadow-sm">
        <table className="w-full text-sm whitespace-nowrap" aria-label={titulo}>
          <thead>
            <tr className="bg-destaque-claro text-principal">
              <th scope="col" className="px-4 py-3 text-left font-semibold">Grupo</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Tentativas</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Erro médio</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Err. abs. médio</th>
              <th scope="col" className="px-4 py-3 text-center font-semibold">Tendência</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item) => (
              <tr key={item.chave} className="border-t border-destaque-claro hover:bg-fundo transition-colors">
                <td className="px-4 py-3 font-medium">{item.chave}</td>
                <td className="px-4 py-3 text-right">{item.quantidade_tentativas}</td>
                <td className={`px-4 py-3 text-right font-mono ${item.erro_medio_ms < 0 ? 'text-blue-600' : item.erro_medio_ms > 0 ? 'text-orange-600' : 'text-green-700'}`}>
                  {item.erro_medio_ms > 0 ? '+' : ''}{item.erro_medio_ms.toFixed(1)} ms
                </td>
                <td className="px-4 py-3 text-right font-mono">{item.erro_absoluto_medio_ms.toFixed(1)} ms</td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center gap-1 text-xs">
                    <span className="text-blue-600">↓{item.abaixo}</span>
                    <span className="text-orange-600">↑{item.acima}</span>
                    <span className="text-green-700">={item.igual}</span>
                    <span className="ml-1 font-semibold text-principal">({item.tendencia_predominante})</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

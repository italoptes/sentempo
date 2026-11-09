import { useEffect, useState } from 'react';
import { requisicao } from '../servicos/api';
import type { Tentativa } from '../tipos/participante';
import { formatarErro, formatarSegundos, rotularCondicao, rotularTempo } from '../utilitarios/formatacao';
import { MetricasAdministracao } from './MetricasAdministracao';
import { IndicadorCarregamento } from './IndicadorCarregamento';

interface PainelLivre {
  participantes_total: number;
  tentativas_total: number;
  tempos_total: number;
  pagina: number;
  total_paginas: number;
  estatisticas: { condicao: string; tempo_alvo_ms: number; quantidade: number; erro_medio_ms: number; erro_absoluto_medio_ms: number }[];
  tentativas: (Tentativa & { participante_id: string })[];
}

export function AdministracaoLivre({ token }: { token: string }) {
  const [painel, definirPainel] = useState<PainelLivre | null>(null);
  const [pagina, definirPagina] = useState(1);
  const [erro, definirErro] = useState<string | null>(null);
  const [carregando, definirCarregando] = useState(true);
  function prepararConsulta() {
    definirCarregando(true);
    definirErro(null);
    definirPainel(null);
  }

  useEffect(() => {
    let presente = true;
    requisicao<PainelLivre>(`/administracao/modo-livre?pagina=${pagina}&tamanho=10`, { token })
      .then(p => { if (presente) definirPainel(p); })
      .catch(() => { if (presente) definirErro('Não foi possível consultar o modo livre. Tente atualizar os dados.'); })
      .finally(() => { if (presente) definirCarregando(false); });
    return () => { presente = false; };
  }, [pagina, token]);

  return <section aria-labelledby="titulo-painel-livre" className="space-y-5">
    <h2 id="titulo-painel-livre" className="sr-only">Resultados do modo livre</h2>
    {erro && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{erro}</p>}
    {carregando && <IndicadorCarregamento mensagem="Consultando modo livre..." />}
    {painel && <>
      <MetricasAdministracao itens={[
        ['Participantes que jogaram', painel.participantes_total], ['Tentativas registradas', painel.tentativas_total], ['Tempos explorados', painel.tempos_total],
      ]} />
      {painel.tentativas_total === 0 ? <p className="rounded-2xl border border-destaque-claro bg-branco p-6 text-texto-secundario">Nenhuma tentativa registrada no modo livre.</p> : <>
        <div className="overflow-x-auto rounded-2xl border border-destaque-claro bg-branco">
          <table className="w-full text-sm whitespace-nowrap">
            <caption className="p-4 text-left font-semibold">Resultados por condição e tempo</caption>
            <thead className="bg-destaque-claro"><tr>{['Condição', 'Alvo', 'Tentativas', 'Erro médio', 'Erro absoluto médio'].map(t => <th key={t} scope="col" className="p-3 text-left">{t}</th>)}</tr></thead>
            <tbody>{painel.estatisticas.map(e => <tr key={`${e.condicao}-${e.tempo_alvo_ms}`} className="border-t border-destaque-claro">
              <td className="p-3">{rotularCondicao(e.condicao)}</td><td className="p-3">{rotularTempo(e.tempo_alvo_ms)}</td><td className="p-3">{e.quantidade}</td><td className="p-3">{formatarErro(e.erro_medio_ms)}</td><td className="p-3">{formatarSegundos(e.erro_absoluto_medio_ms)}</td>
            </tr>)}</tbody>
          </table>
        </div>
        <div className="space-y-1 pt-2"><h3 className="text-lg font-semibold">Tentativas recentes</h3>
        <p className="text-sm text-texto-secundario">Da mais recente para a mais antiga · 10 por página.</p></div>
        <ul className="divide-y divide-destaque-claro overflow-hidden rounded-2xl border border-destaque-claro bg-branco">
          {painel.tentativas.map(t => <li key={t.id} className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-center sm:gap-6">
            <div className="col-span-2 space-y-1 sm:col-span-1">
              <p className="text-sm font-medium" title={t.participante_id}>Participante {t.participante_id.slice(0, 8)}</p>
              <p className="text-xs text-texto-secundario">{new Date(t.criado_em).toLocaleString('pt-BR')}</p>
            </div>
            <div className="text-sm"><p>{rotularCondicao(t.condicao)}</p><p className="mt-1 text-xs text-texto-secundario">Alvo de {rotularTempo(t.tempo_alvo_ms)}</p></div>
            <div className="text-right"><p className="text-base font-semibold tabular-nums">{formatarSegundos(t.resultado_ms)}</p><p className="mt-1 text-xs text-texto-secundario">Erro {formatarErro(t.erro_ms)}</p></div>
          </li>)}
        </ul>
        {painel.total_paginas > 1 && <nav aria-label="Páginas de tentativas do modo livre" className="flex flex-wrap items-center gap-4">
          <button type="button" disabled={pagina <= 1 || carregando} className="min-h-11 underline disabled:opacity-50" onClick={() => { prepararConsulta(); definirPagina(p => p - 1); }}>Anterior</button>
          <span className="text-sm">Página {painel.pagina} de {painel.total_paginas}</span>
          <button type="button" disabled={pagina >= painel.total_paginas || carregando} className="min-h-11 underline disabled:opacity-50" onClick={() => { prepararConsulta(); definirPagina(p => p + 1); }}>Próxima</button>
        </nav>}
      </>}
    </>}
  </section>;
}

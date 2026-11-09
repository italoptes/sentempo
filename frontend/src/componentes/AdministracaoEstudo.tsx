import { useEffect, useState } from 'react';
import { requisicao } from '../servicos/api';
import type { SessaoEstudo, VersaoEstudo } from '../servicos/estudo';
import { rotularCondicaoEstudo } from '../servicos/estudo';
import { SessaoAdministracao } from './SessaoAdministracao';
import { MetricasAdministracao } from './MetricasAdministracao';
import { IndicadorCarregamento } from './IndicadorCarregamento';
import { formatarErro, formatarSegundos } from '../utilitarios/formatacao';

interface PainelEstudo {
  versao_protocolo: string;
  sessoes_total: number;
  sessoes_completas: number;
  tentativas_concluidas: number;
  pagina: number;
  total_paginas: number;
  sessoes: (SessaoEstudo & { codigo_participante: string; nome_participante: string })[];
  estatisticas: { condicao: string; tempo_alvo_ms: number; quantidade: number; erro_medio_ms: number;
    erro_absoluto_medio_ms: number; erro_relativo_medio_percentual: number; abaixo: number; acima: number; igual: number }[];
}

export function AdministracaoEstudo({ token, versao = 'ESTUDO_A_V2' }: { token: string; versao?: VersaoEstudo }) {
  const [painel, definirPainel] = useState<PainelEstudo | null>(null);
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
    requisicao<PainelEstudo>(`/administracao/estudo-a?pagina=${pagina}&tamanho=10&versao=${versao}`, { token })
      .then(p => { if (presente) { definirPainel(p); definirCarregando(false); } })
      .catch(() => { if (presente) { definirErro('Não foi possível consultar o Estudo A. Verifique sua sessão.'); definirCarregando(false); } });
    return () => { presente = false; };
  }, [pagina, token, versao]);
  return <section aria-labelledby="titulo-painel-estudo" className="space-y-5">
    <h2 id="titulo-painel-estudo" className="sr-only">Sessão de estudo</h2>
    {erro && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{erro}</p>}
    {carregando && <IndicadorCarregamento mensagem="Consultando Estudo A..." />}
    {painel && painel.versao_protocolo === versao && <>
      <MetricasAdministracao itens={[
        ['Sessões iniciadas', painel.sessoes_total], ['Sessões completas', painel.sessoes_completas], ['Tentativas confirmadas', painel.tentativas_concluidas],
      ]} />
      {painel.estatisticas.length ? <details className="overflow-hidden rounded-2xl border border-destaque-claro bg-branco">
        <summary className="cursor-pointer px-4 py-4 font-semibold marker:text-destaque">
          <span className="block text-xs font-normal text-texto-secundario mb-1">Médias de todas as tentativas confirmadas</span>
          Resultados por condição e tempo
          <span className="ml-2 text-sm font-normal text-texto-secundario">Clique para abrir ou recolher</span>
        </summary>
        <div className="overflow-x-auto border-t border-destaque-claro"><table className="w-full text-sm whitespace-nowrap"><caption className="sr-only">Resultados por condição e tempo</caption>
          <thead><tr>{['Condição', 'Alvo', 'Tentativas', 'Erro médio', 'Erro absoluto médio', 'Erro relativo médio', 'Abaixo / acima / igual'].map(t => <th scope="col" key={t} className="text-left p-3 bg-destaque-claro">{t}</th>)}</tr></thead>
          <tbody>{painel.estatisticas.map(e => <tr key={`${e.condicao}-${e.tempo_alvo_ms}`} className="border-b border-destaque-claro">
            <td className="p-3">{rotularCondicaoEstudo(e.condicao)}</td><td className="p-3">{e.tempo_alvo_ms / 1000} s</td><td className="p-3">{e.quantidade}</td><td className="p-3">{formatarErro(e.erro_medio_ms)}</td><td className="p-3">{formatarSegundos(e.erro_absoluto_medio_ms)}</td><td className="p-3">{e.erro_relativo_medio_percentual.toFixed(3)}%</td><td className="p-3">{e.abaixo} / {e.acima} / {e.igual}</td>
          </tr>)}</tbody>
        </table></div>
      </details> : <p className="rounded-2xl border border-destaque-claro bg-branco p-6 text-texto-secundario">Nenhuma tentativa confirmada no Estudo A.</p>}
      <div className="space-y-1 pt-2"><h3 className="text-lg font-semibold">Sessões e questionários</h3><p className="text-sm text-texto-secundario">Abra uma sessão para consultar as tentativas e respostas.</p></div>
      {painel.sessoes.length === 0 && <p className="text-sm text-texto-secundario">Nenhuma sessão iniciada nesta versão.</p>}
      {painel.sessoes.length > 0 && <div className="divide-y divide-destaque-claro overflow-hidden rounded-2xl border border-destaque-claro bg-branco">
        {painel.sessoes.map(s => <SessaoAdministracao key={s.id} sessao={s} />)}
      </div>}
      {painel.total_paginas > 1 && <nav aria-label="Páginas de sessões do Estudo A" className="flex gap-4 items-center">
        <button disabled={pagina <= 1 || carregando} className="min-h-11 underline disabled:opacity-50" onClick={() => { prepararConsulta(); definirPagina(p => p - 1); }}>Anterior</button>
        <span>Página {painel.pagina} de {painel.total_paginas}</span>
        <button disabled={pagina >= painel.total_paginas || carregando} className="min-h-11 underline disabled:opacity-50" onClick={() => { prepararConsulta(); definirPagina(p => p + 1); }}>Próxima</button>
      </nav>}
    </>}
  </section>;
}

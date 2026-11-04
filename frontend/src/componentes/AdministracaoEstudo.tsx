import { useCallback, useEffect, useState } from 'react';
import { requisicao } from '../servicos/api';
import { baixarCSV } from '../servicos/administracao';
import type { OrigemExportacao } from '../servicos/administracao';
import type { SessaoEstudo } from '../servicos/estudo';
import { rotularCondicaoEstudo } from '../servicos/estudo';
import { formatarErro, formatarSegundos } from '../utilitarios/formatacao';

interface PainelEstudo {
  versao_protocolo: string;
  sessoes_total: number;
  sessoes_completas: number;
  tentativas_concluidas: number;
  pagina: number;
  total_paginas: number;
  sessoes: (SessaoEstudo & { codigo_participante: string })[];
  estatisticas: { condicao: string; tempo_alvo_ms: number; quantidade: number; erro_medio_ms: number;
    erro_absoluto_medio_ms: number; erro_relativo_medio_percentual: number; abaixo: number; acima: number; igual: number }[];
}

export function AdministracaoEstudo({ token }: { token: string }) {
  const [painel, definirPainel] = useState<PainelEstudo | null>(null);
  const [pagina, definirPagina] = useState(1);
  const [erro, definirErro] = useState<string | null>(null);
  const [carregando, definirCarregando] = useState(true);
  const [exportando, definirExportando] = useState(false);
  const [origem, definirOrigem] = useState<OrigemExportacao>('ESTUDO_A');
  const carregar = useCallback(async () => {
    definirCarregando(true);
    definirErro(null);
    try { definirPainel(await requisicao<PainelEstudo>(`/administracao/estudo-a?pagina=${pagina}&tamanho=10`, { token })); }
    catch { definirErro('Não foi possível consultar o Estudo A. Verifique sua sessão.'); }
    finally { definirCarregando(false); }
  }, [pagina, token]);
  useEffect(() => {
    let presente = true;
    requisicao<PainelEstudo>(`/administracao/estudo-a?pagina=${pagina}&tamanho=10`, { token })
      .then(p => { if (presente) { definirPainel(p); definirCarregando(false); } })
      .catch(() => { if (presente) { definirErro('Não foi possível consultar o Estudo A. Verifique sua sessão.'); definirCarregando(false); } });
    return () => { presente = false; };
  }, [pagina, token]);
  return <section aria-labelledby="titulo-painel-estudo" className="space-y-5">
    <h2 id="titulo-painel-estudo" className="text-xl font-semibold">Estudo A — ESTUDO_A_V1</h2>
    <div className="flex flex-wrap items-center gap-3">
      <button className="min-h-11 underline" disabled={carregando} onClick={() => void carregar()}>Atualizar Estudo A</button>
      <label>Base para exportação
        <select value={origem} onChange={e => definirOrigem(e.target.value as OrigemExportacao)} className="border border-borda-controle rounded-lg p-3 ml-2">
          <option value="ESTUDO_A">Estudo A</option><option value="ANTERIOR">Protocolo anterior</option><option value="LIVRE">Modo livre</option>
        </select>
      </label>
      <button className="min-h-12 bg-destaque text-principal font-medium rounded-xl px-4" disabled={exportando} onClick={async () => {
        definirExportando(true);
        try { await baixarCSV(token, origem); } catch (e) { definirErro(e instanceof Error ? e.message : 'Falha na exportação'); }
        finally { definirExportando(false); }
      }}>{exportando ? 'Exportando...' : 'Exportar base selecionada'}</button>
    </div>
    <p className="text-sm text-texto-secundario">As bases são exportadas separadamente, com pseudônimo em UUID, sem nome nem código de acesso. O modo livre não integra as estatísticas oficiais.</p>
    {erro && <p role="alert">{erro}</p>}
    {carregando && <p role="status">Consultando Estudo A...</p>}
    {painel && <>
      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[['Sessões', painel.sessoes_total], ['Sessões completas', painel.sessoes_completas], ['Tentativas confirmadas', painel.tentativas_concluidas]].map(([rotulo, valor]) => <div key={rotulo} className="bg-branco border border-destaque-claro rounded-xl p-4"><dt>{rotulo}</dt><dd className="text-2xl font-semibold">{valor}</dd></div>)}
      </dl>
      <p className="text-sm">As médias incluem resultados confirmados de sessões completas e em andamento. A base exportada identifica a conclusão da sessão.</p>
      {painel.estatisticas.length ? <div className="overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap"><caption className="text-left font-medium mb-3">Resultados por condição e tempo-alvo — Estudo A</caption>
          <thead><tr>{['Condição', 'Alvo', 'Tentativas', 'Erro médio', 'Erro absoluto médio', 'Erro relativo médio', 'Abaixo / acima / igual'].map(t => <th scope="col" key={t} className="text-left p-3 bg-destaque-claro">{t}</th>)}</tr></thead>
          <tbody>{painel.estatisticas.map(e => <tr key={`${e.condicao}-${e.tempo_alvo_ms}`} className="border-b border-destaque-claro">
            <td className="p-3">{rotularCondicaoEstudo(e.condicao)}</td><td className="p-3">{e.tempo_alvo_ms / 1000} s</td><td className="p-3">{e.quantidade}</td><td className="p-3">{formatarErro(e.erro_medio_ms)}</td><td className="p-3">{formatarSegundos(e.erro_absoluto_medio_ms)}</td><td className="p-3">{e.erro_relativo_medio_percentual.toFixed(3)}%</td><td className="p-3">{e.abaixo} / {e.acima} / {e.igual}</td>
          </tr>)}</tbody>
        </table>
      </div> : <p>Nenhuma tentativa confirmada no Estudo A.</p>}
      <h3 className="font-semibold">Sessões e respostas</h3>
      {painel.sessoes.map(s => <details key={s.id} className="border border-borda-controle rounded-xl p-4 bg-branco">
        <summary className="min-h-12 cursor-pointer break-words">Participante {s.codigo_participante} — {s.concluidas}/27 — {s.situacao.replaceAll('_', ' ').toLowerCase()}</summary>
        <div className="space-y-3 mt-4">
          <p className="break-all">Sessão: {s.id} · sequência {s.sequencia + 1}</p>
          <p>Ordem: {s.ordem_condicoes.map(rotularCondicaoEstudo).join(' → ')}</p>
          <p>{s.dispositivo.toLowerCase()} · fones: {s.usa_fones ? 'sim' : 'não'} · volume configurado: {s.volume}</p>
          <p>Estratégia: {s.estrategia?.replaceAll('_', ' ').toLowerCase() ?? (s.concluida_em ? 'prefere não responder' : 'pendente')}</p>
          {s.comentario && <p>Comentário: {s.comentario}</p>}
          {s.respostas_blocos.map(b => <p key={b.bloco}>Bloco {b.bloco}: agradabilidade {b.agradabilidade ?? 'não respondeu'}; ansiedade {b.ansiedade ?? 'não respondeu'}</p>)}
          <ol className="space-y-2">{s.tentativas.map(t => <li key={t.id} className="border-t border-destaque-claro pt-2 text-sm">
            {t.ordem}. Bloco {t.bloco} · repetição {t.repeticao} · {rotularCondicaoEstudo(t.condicao)} · alvo {t.tempo_alvo_ms / 1000} s — {t.concluida ? <>resultado {formatarSegundos(t.resultado_ms ?? 0)}; erro {formatarErro(t.erro_ms ?? 0)}; absoluto {formatarSegundos(t.erro_absoluto_ms ?? 0)}; relativo {t.erro_relativo_percentual?.toFixed(3)}%; confiança {t.questionario_respondido ? t.confianca ?? 'não respondeu' : 'pendente'}</> : 'pendente'}
          </li>)}</ol>
        </div>
      </details>)}
      {painel.total_paginas > 1 && <nav aria-label="Páginas de sessões do Estudo A" className="flex gap-4 items-center">
        <button disabled={pagina <= 1 || carregando} className="min-h-11 underline disabled:opacity-50" onClick={() => definirPagina(p => p - 1)}>Anterior</button>
        <span>Página {painel.pagina} de {painel.total_paginas}</span>
        <button disabled={pagina >= painel.total_paginas || carregando} className="min-h-11 underline disabled:opacity-50" onClick={() => definirPagina(p => p + 1)}>Próxima</button>
      </nav>}
    </>}
  </section>;
}

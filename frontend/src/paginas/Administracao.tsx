// paginas/Administracao.tsx — Dashboard administrativo (rota /administracao)

import { useCallback, useEffect, useRef, useState } from 'react';
import { usarAdministracao } from '../ganchos/usarAdministracao';
import { TabelaParticipantes } from '../componentes/TabelaParticipantes';
import { detalharParticipante } from '../servicos/administracao';
import type { ParticipanteAdministracao } from '../tipos/administracao';
import { TabelaResultados } from '../componentes/TabelaResultados';
import { ModalConfirmacao } from '../componentes/ModalConfirmacao';
import { Ring } from '../componentes/loading-ui/Ring';
import { AdministracaoEstudo } from '../componentes/AdministracaoEstudo';
import { AdministracaoLivre } from '../componentes/AdministracaoLivre';
import { baixarCSV } from '../servicos/administracao';

// ─── Login ─────────────────────────────────────────────────────────────────────
function TelaLogin({
  onLogin,
  carregando,
  erro,
}: {
  onLogin: (nome: string, codigo: string) => Promise<boolean>;
  carregando: boolean;
  erro: string | null;
}) {
  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onLogin(nome, codigo);
  }

  return (
    <div id="conteudo-principal" tabIndex={-1} className="min-h-screen bg-fundo flex flex-col items-center justify-center px-4 py-12 pagina-entrar">
      <div className="w-full max-w-md space-y-8 lg:max-w-5xl lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:space-y-0">
        <div className="text-center lg:text-left">
          <img src="/images/logo_principal.png" alt="Sentempo" className="h-16 mx-auto object-contain mb-6 lg:mx-0 lg:h-20" />
          <h1 className="text-3xl font-semibold text-principal">Área administrativa</h1>
          <p className="text-texto-secundario text-sm mt-1">Acompanhe as sessões de estudo e os resultados do modo livre. Acesso restrito à equipe de pesquisa.</p>
        </div>

        <div className="bg-branco rounded-2xl border border-destaque-claro p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="admin-nome" className="block text-sm font-medium text-principal mb-1">Nome</label>
              <input
                id="admin-nome"
                type="text"
                autoComplete="username"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-borda-controle bg-branco text-principal text-sm
                  focus:outline-none focus:border-principal focus:ring-1 focus:ring-destaque"
              />
            </div>
            <div>
              <label htmlFor="admin-codigo" className="block text-sm font-medium text-principal mb-1">Código</label>
              <input
                id="admin-codigo"
                type="password"
                autoComplete="current-password"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-borda-controle bg-branco text-principal text-sm
                  focus:outline-none focus:border-principal focus:ring-1 focus:ring-destaque"
              />
            </div>
            {erro && (
              <p role="alert" className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-2">{erro}</p>
            )}
            <button
              id="btn-login-admin"
              type="submit"
              disabled={carregando}
              className="w-full py-3 bg-principal text-branco font-semibold rounded-xl
                hover:bg-[#0a2021] transition-colors focus-visible:outline-2 focus-visible:outline-destaque
                disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {carregando ? (
                <span role="status" aria-live="polite" className="inline-flex items-center justify-center gap-2">
                  <Ring className="size-4" />
                  Autenticando...
                </span>
              ) : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export function Administracao() {
  const {
    token,
    autenticado,
    carregando,
    erro,
    pagina,
    login,
    sair,
    carregarParticipantes,
  } = usarAdministracao();

  const [area, definirArea] = useState<'PESQUISA' | 'LIVRE'>('PESQUISA');
  const [atualizacao, definirAtualizacao] = useState(0);
  const [erroExportacao, definirErroExportacao] = useState<string | null>(null);
  const [exportando, definirExportando] = useState(false);
  const [busca, setBusca] = useState('');
  const [detalhe, setDetalhe] = useState<ParticipanteAdministracao | null>(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [modalZerar, setModalZerar] = useState(false);
  const [modalExcluirConta, setModalExcluirConta] = useState<string | null>(null);
  const [tentativaParaExcluir, setTentativaParaExcluir] = useState<{ participanteId: string, tentativaId: string } | null>(null);
  const painelDetalheRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (autenticado && area === 'LIVRE') {
      void carregarParticipantes(1, 20);
    }
  }, [autenticado, area, atualizacao, carregarParticipantes]);

  useEffect(() => {
    if (detalhe) {
      setTimeout(() => {
        painelDetalheRef.current?.focus({ preventScroll: true });
        painelDetalheRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, [detalhe]);

  const handlePaginar = useCallback(
    (p: number) => {
      void carregarParticipantes(p, 20, busca || undefined);
    },
    [busca, carregarParticipantes],
  );

  const handleBuscar = useCallback(
    (b: string) => {
      setBusca(b);
      void carregarParticipantes(1, 20, b || undefined);
    },
    [carregarParticipantes],
  );

  const handleDetalhar = useCallback(
    async (id: string) => {
      if (!token) return;
      setCarregandoDetalhe(true);
      try {
        const dados = await detalharParticipante(token, id);
        setDetalhe(dados);
      } catch {
        setDetalhe(null);
      } finally {
        setCarregandoDetalhe(false);
      }
    },
    [token],
  );

  if (!autenticado) {
    return <TelaLogin onLogin={login} carregando={carregando} erro={erro} />;
  }

  return (
    <div className="min-h-screen bg-fundo pagina-entrar">
      {/* Cabeçalho */}
      <header className="bg-principal shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 lg:px-8 lg:py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/logo_principal.png" alt="Sentempo" className="h-8 object-contain brightness-0 invert" />
            <span className="hidden sm:block border-l border-destaque-claro/30 pl-3 text-destaque-claro text-sm">Administração</span>
          </div>
          <button
            id="btn-sair-admin"
            type="button"
            onClick={sair}
            className="text-sm text-destaque-claro hover:text-branco transition-colors
              focus-visible:outline-2 focus-visible:outline-destaque rounded px-2 py-1"
          >
            Sair
          </button>
        </div>
      </header>

      <main id="conteudo-principal" tabIndex={-1} className="max-w-6xl mx-auto px-4 py-6 space-y-6 lg:px-8 lg:py-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold lg:text-3xl">Painel administrativo</h1>
          <p className="text-sm text-texto-secundario">Consulte os resultados e exporte a base selecionada.</p>
        </div>
        <div role="tablist" aria-label="Áreas da administração" className="flex border-b border-destaque-claro">
          {([['PESQUISA', 'Pesquisa'], ['LIVRE', 'Modo livre']] as const).map(([id, rotulo], indice) => (
            <button key={id} id={`aba-${id}`} role="tab" type="button" aria-selected={area === id} aria-controls={`painel-${id}`} tabIndex={area === id ? 0 : -1} disabled={exportando}
              onClick={() => { definirArea(id); setDetalhe(null); definirErroExportacao(null); }}
              onKeyDown={e => {
                let destino: 'PESQUISA' | 'LIVRE' | null = null;
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') destino = indice === 0 ? 'LIVRE' : 'PESQUISA';
                if (e.key === 'Home') destino = 'PESQUISA';
                if (e.key === 'End') destino = 'LIVRE';
                if (destino) { e.preventDefault(); definirArea(destino); setDetalhe(null); definirErroExportacao(null); document.getElementById(`aba-${destino}`)?.focus(); }
              }}
              className={`min-h-14 flex-1 border-b-3 px-6 text-sm font-semibold transition-colors sm:flex-none ${area === id ? 'border-destaque text-principal bg-destaque-claro/20' : 'border-transparent text-texto-secundario hover:text-principal hover:bg-branco'} disabled:opacity-50`}>
              {rotulo}
            </button>
          ))}
        </div>
        <section aria-label="Controles do painel" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">{area === 'PESQUISA' ? 'Resultados da pesquisa' : 'Resultados dos jogos'}</h2>
            <p className="text-sm text-texto-secundario">{area === 'PESQUISA' ? 'Sessões guiadas e respostas aos questionários.' : 'Todos os modos de jogo, incluindo o clássico e os desafios personalizados.'}</p>
          </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <button type="button" onClick={() => definirAtualizacao(a => a + 1)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-destaque-claro px-4 text-sm font-medium transition-colors hover:bg-fundo">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6.1 6a8 8 0 0 1 13 2L20 12M4 12l.9 4a8 8 0 0 0 13 2"/></svg>
                Atualizar
              </button>
              <button type="button" disabled={exportando} onClick={async () => {
                if (!token) return;
                definirExportando(true);
                definirErroExportacao(null);
                try { await baixarCSV(token, area === 'LIVRE' ? 'LIVRE' : 'ESTUDO_A'); }
                catch (e) { definirErroExportacao(e instanceof Error ? e.message : 'Falha na exportação'); }
                finally { definirExportando(false); }
              }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-destaque px-4 text-sm font-semibold transition-colors hover:bg-[#00a890] disabled:opacity-50">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4"><path d="M12 3v12m-4-4 4 4 4-4M5 16v5h14v-5"/></svg>
                {exportando ? 'Exportando...' : 'Exportar CSV'}
              </button>
            </div>
        </section>
        {erroExportacao && <p role="alert" className="text-sm text-red-700">{erroExportacao}</p>}
        <div id="painel-PESQUISA" role="tabpanel" aria-labelledby="aba-PESQUISA" hidden={area !== 'PESQUISA'} tabIndex={0}>
          {token && area === 'PESQUISA' && <AdministracaoEstudo key={`pesquisa-${atualizacao}`} token={token} />}
        </div>
        <div id="painel-LIVRE" role="tabpanel" aria-labelledby="aba-LIVRE" hidden={area !== 'LIVRE'} tabIndex={0} className="space-y-6">
        {token && area === 'LIVRE' && <AdministracaoLivre key={`livre-${atualizacao}`} token={token} />}
        {area === 'LIVRE' && <>
        <details className="rounded-2xl border border-destaque-claro bg-branco p-4">
          <summary className="min-h-11 cursor-pointer font-semibold">Gerenciar participantes</summary>
          <p className="mb-4 text-sm text-texto-secundario">Consulte as contas e os resultados dos jogos de cada participante.</p>
          {erro && <p role="alert" className="mb-4 text-sm text-red-700">{erro}</p>}
        {/* Lista de participantes */}
        {pagina && (
          <section aria-label="Participantes">
            <h2 className="text-sm font-semibold text-texto-secundario uppercase tracking-wide mb-4">Participantes</h2>
            <TabelaParticipantes
              mostrarProgresso={false}
              pagina={pagina}
              onPaginar={handlePaginar}
              onBuscar={handleBuscar}
              onDetalhar={handleDetalhar}
              onExcluirConta={(id) => setModalExcluirConta(id)}
              carregando={carregando || carregandoDetalhe}
            />
          </section>
        )}

        {/* Painel de detalhe do participante */}
        {detalhe && (
          <section
            ref={painelDetalheRef}
            id="painel-detalhe"
            tabIndex={-1}
            aria-label="Detalhe do participante"
            className="bg-branco rounded-2xl border border-destaque-claro p-6 space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-principal">{detalhe.participante.nome}</h2>
                <p className="text-texto-secundario text-sm font-mono">Código: {detalhe.participante.codigo}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setModalExcluirConta(detalhe.participante.id)}
                  className="text-red-500 hover:text-red-700 transition-colors text-sm font-medium
                    focus-visible:outline-2 focus-visible:outline-destaque rounded px-2 py-1"
                >
                  Excluir conta
                </button>
                <button
                  type="button"
                  onClick={() => setModalZerar(true)}
                  className="text-texto-secundario hover:text-principal transition-colors text-sm font-medium
                    focus-visible:outline-2 focus-visible:outline-destaque rounded px-2 py-1"
                >
                  Zerar resultados
                </button>
                <button
                  type="button"
                  onClick={() => setDetalhe(null)}
                  className="text-texto-secundario hover:text-principal transition-colors text-sm
                    focus-visible:outline-2 focus-visible:outline-destaque rounded px-2 py-1"
                  aria-label="Fechar painel de detalhe"
                >
                  ✕ Fechar
                </button>
              </div>
            </div>

            <TabelaResultados
              tentativas={[...detalhe.participante.tentativas, ...(detalhe.participante.tentativas_livres ?? [])]}
              onExcluir={id => setTentativaParaExcluir({ participanteId: detalhe.participante.id, tentativaId: id })}
            />
          </section>
        )}
        </details>
        </>}
        </div>
      </main>

      {/* Modais */}
      <ModalConfirmacao
        aberto={modalZerar}
        titulo="Zerar resultados dos jogos"
        mensagem="Apagar todos os resultados dos jogos deste participante? As sessões e respostas da pesquisa serão mantidas."
        textoConfirmar="Sim, apagar tudo"
        tipo="perigo"
        onConfirmar={async () => {
          if (!detalhe || !token) return;
          setModalZerar(false);
          const { excluirTodas } = await import('../servicos/tentativas');
          try {
            await excluirTodas(detalhe.participante.id, token);
            void handleDetalhar(detalhe.participante.id);
            definirAtualizacao(a => a + 1);
            void carregarParticipantes(pagina?.pagina ?? 1, 20, busca || undefined);
          } catch {
            alert('Erro ao apagar resultados');
          }
        }}
        onCancelar={() => setModalZerar(false)}
      />

      <ModalConfirmacao
        aberto={modalExcluirConta !== null}
        titulo="Excluir conta"
        mensagem="ATENÇÃO: Apagar a conta deste participante? Todos os resultados dos jogos, sessões e respostas da pesquisa serão apagados permanentemente."
        textoConfirmar="Sim, excluir conta"
        tipo="perigo"
        onConfirmar={async () => {
          if (!modalExcluirConta || !token) return;
          const idParaExcluir = modalExcluirConta;
          setModalExcluirConta(null);
          const { excluirParticipante } = await import('../servicos/administracao');
          try {
            await excluirParticipante(token, idParaExcluir);
            if (detalhe?.participante.id === idParaExcluir) {
              setDetalhe(null);
            }
            definirAtualizacao(a => a + 1);
            void carregarParticipantes(pagina?.pagina ?? 1, 20, busca || undefined);
          } catch {
            alert('Erro ao apagar conta');
          }
        }}
        onCancelar={() => setModalExcluirConta(null)}
      />

      <ModalConfirmacao
        aberto={tentativaParaExcluir !== null}
        titulo="Excluir resultado"
        mensagem="Tem certeza que deseja excluir este resultado?"
        textoConfirmar="Sim, excluir"
        tipo="perigo"
        onConfirmar={async () => {
          if (!tentativaParaExcluir || !detalhe || !token) return;
          const { participanteId, tentativaId } = tentativaParaExcluir;
          setTentativaParaExcluir(null);
          try {
            const { excluirUma } = await import('../servicos/tentativas');
            await excluirUma(participanteId, tentativaId, token);
            void handleDetalhar(participanteId);
            definirAtualizacao(a => a + 1);
            void carregarParticipantes(pagina?.pagina ?? 1, 20, busca || undefined);
          } catch {
            alert('Erro ao excluir resultado');
          }
        }}
        onCancelar={() => setTentativaParaExcluir(null)}
      />
    </div>
  );
}

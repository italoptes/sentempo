// paginas/Administracao.tsx — Dashboard administrativo (rota /administracao)

import { useCallback, useEffect, useState } from 'react';
import { usarAdministracao } from '../ganchos/usarAdministracao';
import { ResumoEstatisticas, TabelaEstatisticas } from '../componentes/ResumoEstatisticas';
import { TabelaParticipantes } from '../componentes/TabelaParticipantes';
import { detalharParticipante } from '../servicos/administracao';
import type { ParticipanteAdministracao } from '../tipos/administracao';
import { TabelaResultados } from '../componentes/TabelaResultados';
import { ModalConfirmacao } from '../componentes/ModalConfirmacao';
import { rotularCondicao, rotularTempo, formatarErro, formatarErroAbsoluto } from '../utilitarios/formatacao';

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
    <div className="min-h-screen bg-fundo flex flex-col items-center justify-center px-4 py-12 pagina-entrar">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <img src="/images/logo_principal.png" alt="Sentempo" className="h-14 mx-auto object-contain mb-4" />
          <h1 className="text-xl font-semibold text-principal">Área Administrativa</h1>
          <p className="text-texto-secundario text-sm mt-1">Acesso restrito à equipe de pesquisa.</p>
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
                className="w-full px-4 py-3 rounded-xl border border-destaque-claro bg-branco text-principal text-sm
                  focus:outline-none focus:border-destaque focus:ring-1 focus:ring-destaque"
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
                className="w-full px-4 py-3 rounded-xl border border-destaque-claro bg-branco text-principal text-sm
                  focus:outline-none focus:border-destaque focus:ring-1 focus:ring-destaque"
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
              {carregando ? 'Autenticando...' : 'Entrar'}
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
    resumo,
    estatisticasCondicao,
    estatisticasTempo,
    estatisticasTempoCondicao,
    pagina,
    login,
    sair,
    carregarResumo,
    carregarParticipantes,
  } = usarAdministracao();

  const [busca, setBusca] = useState('');
  const [detalhe, setDetalhe] = useState<ParticipanteAdministracao | null>(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [modalZerar, setModalZerar] = useState(false);
  const [modalExcluirConta, setModalExcluirConta] = useState<string | null>(null);
  const [tentativaParaExcluir, setTentativaParaExcluir] = useState<{ participanteId: string, tentativaId: string } | null>(null);

  useEffect(() => {
    if (autenticado) {
      void carregarResumo();
      void carregarParticipantes(1, 20);
    }
  }, [autenticado, carregarResumo, carregarParticipantes]);

  useEffect(() => {
    if (detalhe) {
      setTimeout(() => {
        document.getElementById('painel-detalhe')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/icone_sentempo.png" alt="Sentempo" className="h-7 w-7 object-contain" />
            <span className="text-destaque-claro font-semibold text-sm">Dashboard Administrativo</span>
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

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {/* Erro geral */}
        {erro && !carregando && (
          <p role="alert" className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{erro}</p>
        )}

        {/* Resumo e estatísticas */}
        {resumo ? (
          <>
            <section aria-label="Resumo geral">
              <h2 className="text-sm font-semibold text-texto-secundario uppercase tracking-wide mb-4">Resumo geral</h2>
              <ResumoEstatisticas resumo={resumo} />
            </section>

            <div className="grid md:grid-cols-2 gap-8">
              {estatisticasCondicao && (
                <section aria-label="Estatísticas por condição">
                  <TabelaEstatisticas titulo="Por condição" itens={estatisticasCondicao.itens.map(i => ({...i, chave: rotularCondicao(i.chave)}))} />
                </section>
              )}
              {estatisticasTempo && (
                <section aria-label="Estatísticas por tempo">
                  <TabelaEstatisticas titulo="Por tempo" itens={estatisticasTempo.itens.map(i => ({...i, chave: rotularTempo(Number(i.chave))}))} />
                </section>
              )}
            </div>
            
            {estatisticasTempoCondicao && (
              <section aria-label="Estatísticas por tempo e condição">
                <h2 className="text-sm font-semibold text-texto-secundario uppercase tracking-wide mb-4">Por tempo e condição</h2>
                <div className="space-y-4">
                  {['5000', '15000', '30000'].map((tempo) => {
                    const itensDoTempo = estatisticasTempoCondicao.itens
                      .filter((i) => i.chave.startsWith(`${tempo}_`))
                      .map((i) => {
                        const condicaoRestante = i.chave.substring(tempo.length + 1);
                        return {
                          ...i,
                          chave: rotularCondicao(condicaoRestante),
                        };
                      });

                    if (itensDoTempo.length === 0) return null;

                    return (
                      <details
                        key={tempo}
                        className="bg-branco rounded-xl border border-destaque-claro overflow-hidden group"
                      >
                        <summary className="px-4 py-3 cursor-pointer font-semibold text-principal flex justify-between items-center hover:bg-fundo transition-colors">
                          {rotularTempo(Number(tempo))}
                          <span className="text-texto-secundario group-open:rotate-180 transition-transform">▼</span>
                        </summary>
                        <div className="p-4 pt-0 border-t border-destaque-claro bg-fundo">
                          <TabelaEstatisticas titulo="" itens={itensDoTempo} />
                        </div>
                      </details>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        ) : carregando ? (
          <p className="text-texto-secundario animate-pulse">Carregando dados...</p>
        ) : null}

        {/* Exportação CSV */}
        {token && (
          <div>
            <a
              id="btn-exportar-csv"
              href={`${import.meta.env.VITE_URL_API ?? '/api'}/administracao/exportacao.csv`}
              download="sentempo-resultados.csv"
              onClick={(e) => {
                // Usa fetch para incluir o token no header
                e.preventDefault();
                const url = `${import.meta.env.VITE_URL_API ?? '/api'}/administracao/exportacao.csv`;
                fetch(url, { headers: { Authorization: `Bearer ${token}` } })
                  .then((r) => r.blob())
                  .then((blob) => {
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = 'sentempo-resultados.csv';
                    a.click();
                  })
                  .catch(() => alert('Erro ao exportar CSV'));
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-destaque text-principal
                font-medium rounded-xl hover:bg-[#00a890] transition-colors
                focus-visible:outline-2 focus-visible:outline-destaque text-sm"
            >
              ↓ Exportar CSV
            </a>
          </div>
        )}

        {/* Lista de participantes */}
        {pagina && (
          <section aria-label="Participantes">
            <h2 className="text-sm font-semibold text-texto-secundario uppercase tracking-wide mb-4">Participantes</h2>
            <TabelaParticipantes
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
          <section id="painel-detalhe" aria-label="Detalhe do participante" className="bg-branco rounded-2xl border border-destaque-claro p-6 space-y-6">
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

            {/* Combinações */}
            <div>
              <h3 className="text-sm font-semibold text-texto-secundario uppercase tracking-wide mb-3">Combinações</h3>
              <div className="space-y-4">
                {[5000, 15000, 30000].map((tempo) => {
                  const combsDoTempo = detalhe.participante.combinacoes.filter(c => c.tempo_alvo_ms === tempo);
                  if (combsDoTempo.length === 0) return null;
                  return (
                    <details
                      key={`comb-${tempo}`}
                      className="bg-branco rounded-xl border border-destaque-claro overflow-hidden group"
                    >
                      <summary className="px-4 py-3 cursor-pointer font-semibold text-principal flex justify-between items-center hover:bg-fundo transition-colors">
                        <span>
                          {rotularTempo(tempo)}
                          <span className="text-texto-secundario ml-2 font-normal">
                            - {combsDoTempo.filter(c => c.concluida).length}/{combsDoTempo.length}
                          </span>
                        </span>
                        <span className="text-texto-secundario group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <div className="p-4 pt-0 border-t border-destaque-claro bg-fundo">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-4">
                          {combsDoTempo.map((c) => (
                            <div
                              key={`${c.tempo_alvo_ms}-${c.condicao}`}
                              className={`rounded-xl px-3 py-2 text-xs border ${
                                c.concluida
                                  ? 'bg-destaque-claro border-destaque text-principal'
                                  : 'bg-fundo border-destaque-claro text-texto-secundario'
                              }`}
                            >
                              <p className="font-semibold">{rotularTempo(c.tempo_alvo_ms)}</p>
                              <p>{rotularCondicao(c.condicao)}</p>
                              <p className="mt-1">{c.concluida ? '✓ Concluída' : 'Pendente'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </details>
                  );
                })}
              </div>
            </div>

            {/* Resumo individual */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-fundo rounded-xl p-3 text-center">
                <p className="text-xs text-texto-secundario mb-1">Erro médio</p>
                <p className="font-semibold text-principal">{formatarErro(detalhe.resumo.erro_medio_ms)}</p>
              </div>
              <div className="bg-fundo rounded-xl p-3 text-center">
                <p className="text-xs text-texto-secundario mb-1">Err. abs. médio</p>
                <p className="font-semibold text-principal">{formatarErroAbsoluto(detalhe.resumo.erro_absoluto_medio_ms)}</p>
              </div>
              <div className="bg-fundo rounded-xl p-3 text-center">
                <p className="text-xs text-texto-secundario mb-1">Tendência</p>
                <p className="font-semibold text-principal">{detalhe.resumo.tendencia.predominante}</p>
              </div>
            </div>

            {/* Tentativas */}
            <div>
              <h3 className="text-sm font-semibold text-texto-secundario uppercase tracking-wide mb-3">Resultados Oficiais</h3>
              <div className="space-y-4">
                {[5000, 15000, 30000].map((tempo) => {
                  const tentativasDoTempo = detalhe.participante.tentativas.filter(t => t.tempo_alvo_ms === tempo);
                  if (tentativasDoTempo.length === 0) return null;
                  return (
                    <details
                      key={`tentativas-${tempo}`}
                      className="bg-branco rounded-xl border border-destaque-claro overflow-hidden group"
                    >
                      <summary className="px-4 py-3 cursor-pointer font-semibold text-principal flex justify-between items-center hover:bg-fundo transition-colors">
                        {rotularTempo(tempo)}
                        <span className="text-texto-secundario group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <div className="p-4 pt-0 border-t border-destaque-claro bg-fundo">
                        <div className="mt-4">
                          <TabelaResultados
                            tentativas={tentativasDoTempo}
                            onExcluir={(id) => setTentativaParaExcluir({ participanteId: detalhe.participante.id, tentativaId: id })}
                          />
                        </div>
                      </div>
                    </details>
                  );
                })}
              </div>
            </div>

            {/* Tentativas Livres */}
            {detalhe.participante.tentativas_livres && detalhe.participante.tentativas_livres.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-texto-secundario uppercase tracking-wide mb-3">Resultados do Modo Livre</h3>
                <div className="space-y-4">
                  {Array.from(new Set(detalhe.participante.tentativas_livres.map(t => t.tempo_alvo_ms))).sort((a, b) => a - b).map((tempo) => {
                    const tentativasDoTempo = detalhe.participante.tentativas_livres.filter(t => t.tempo_alvo_ms === tempo);
                    return (
                      <details
                        key={`livres-${tempo}`}
                        className="bg-branco rounded-xl border border-destaque-claro overflow-hidden group"
                      >
                        <summary className="px-4 py-3 cursor-pointer font-semibold text-principal flex justify-between items-center hover:bg-fundo transition-colors">
                          {rotularTempo(tempo)}
                          <span className="text-texto-secundario group-open:rotate-180 transition-transform">▼</span>
                        </summary>
                        <div className="p-4 pt-0 border-t border-destaque-claro bg-fundo">
                          <div className="mt-4">
                            <TabelaResultados
                              tentativas={tentativasDoTempo}
                              onExcluir={(id) => setTentativaParaExcluir({ participanteId: detalhe.participante.id, tentativaId: id })}
                            />
                          </div>
                        </div>
                      </details>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Modais */}
      <ModalConfirmacao
        aberto={modalZerar}
        titulo="Zerar resultados"
        mensagem="Tem certeza que deseja apagar todos os resultados oficiais e livres deste participante?"
        textoConfirmar="Sim, apagar tudo"
        tipo="perigo"
        onConfirmar={async () => {
          if (!detalhe) return;
          setModalZerar(false);
          const { excluirTodas } = await import('../servicos/tentativas');
          try {
            await excluirTodas(detalhe.participante.id);
            void handleDetalhar(detalhe.participante.id);
            void carregarResumo();
            void carregarParticipantes(pagina?.pagina ?? 1, 20, busca || undefined);
          } catch (e) {
            alert('Erro ao apagar resultados');
          }
        }}
        onCancelar={() => setModalZerar(false)}
      />

      <ModalConfirmacao
        aberto={modalExcluirConta !== null}
        titulo="Excluir conta"
        mensagem="ATENÇÃO: Tem certeza que deseja apagar a conta deste participante? TODOS os resultados oficiais, livres e configurações de tempos personalizados serão apagados permanentemente."
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
            void carregarResumo();
            void carregarParticipantes(pagina?.pagina ?? 1, 20, busca || undefined);
          } catch (e) {
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
          if (!tentativaParaExcluir || !detalhe) return;
          const { participanteId, tentativaId } = tentativaParaExcluir;
          setTentativaParaExcluir(null);
          try {
            const { excluirUma } = await import('../servicos/tentativas');
            await excluirUma(participanteId, tentativaId);
            void handleDetalhar(participanteId);
            void carregarResumo();
            void carregarParticipantes(pagina?.pagina ?? 1, 20, busca || undefined);
          } catch (e) {
            alert('Erro ao excluir resultado');
          }
        }}
        onCancelar={() => setTentativaParaExcluir(null)}
      />
    </div>
  );
}

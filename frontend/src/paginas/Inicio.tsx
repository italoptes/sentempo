// paginas/Inicio.tsx — Menu principal do participante (rota /inicio)

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ParticipanteDetalhe, Combinacao } from '../tipos/participante';
import type { ModoLivreStatus } from '../servicos/modo_livre';
import { CartaoProgresso } from '../componentes/CartaoProgresso';
import { SeletorTempo } from '../componentes/SeletorTempo';
import { SeletorCondicao } from '../componentes/SeletorCondicao';
import { TabelaResultados } from '../componentes/TabelaResultados';
import { ModalConfirmacao } from '../componentes/ModalConfirmacao';
import { IndicadorCarregamento } from '../componentes/IndicadorCarregamento';

interface Props {
  participante: ParticipanteDetalhe;
  modoLivre: ModoLivreStatus | null;
  onSair: () => void;
  onRecarregar: () => Promise<void>;
}

export function Inicio({ participante, modoLivre, onSair, onRecarregar }: Props) {
  const navigate = useNavigate();
  const [tempoSelecionado, setTempoSelecionado] = useState<number | null>(null);
  const [paginaDesafio, setPaginaDesafio] = useState(0);
  const [resultadosAbertos, setResultadosAbertos] = useState(true);
  const paginasDesafioRef = useRef<HTMLDivElement>(null);
  const inputNovoTempoRef = useRef<HTMLInputElement>(null);
  const [novoTempo, setNovoTempo] = useState('');
  const [erroNovoTempo, setErroNovoTempo] = useState<string | null>(null);

  const [tempoParaExcluir, setTempoParaExcluir] = useState<string | null>(null);
  const [tentativaParaExcluir, setTentativaParaExcluir] = useState<string | null>(null);
  const [tempoParaJogar, setTempoParaJogar] = useState<{ id: string; ms: number } | null>(null);

  // Recarrega perfil ao montar (garante progresso atualizado)
  useEffect(() => {
    void onRecarregar();
  }, [onRecarregar]);

  const handleSelecionarCondicao = useCallback(
    (condicao: string) => {
      if (tempoSelecionado === null) return;
      navigate(`/experimento/${tempoSelecionado}/${condicao}`);
    },
    [tempoSelecionado, navigate],
  );

  const handleSelecionarTempo = useCallback((tempo: number) => {
    setTempoSelecionado(tempo);
    const container = paginasDesafioRef.current;
    if (container) {
      container.scrollTo({ left: container.scrollWidth - container.clientWidth, behavior: 'smooth' });
    }
  }, []);

  const irParaPaginaDesafio = useCallback((pagina: number) => {
    const container = paginasDesafioRef.current;
    if (!container) return;
    const ultimaPagina = container.scrollWidth - container.clientWidth;
    container.scrollTo({ left: pagina === 0 ? 0 : ultimaPagina, behavior: 'smooth' });
  }, []);

  const handleAdicionarTempo = useCallback(async () => {
    const valor = Number(novoTempo);
    if (!Number.isInteger(valor) || valor < 1 || valor > 120) {
      setErroNovoTempo('Digite um número inteiro entre 1 e 120 segundos.');
      inputNovoTempoRef.current?.focus();
      return;
    }

    try {
      const { criarTempoPersonalizado } = await import('../servicos/modo_livre');
      await criarTempoPersonalizado(participante.id, valor * 1000);
      await onRecarregar();
      setNovoTempo('');
      setErroNovoTempo(null);
    } catch (erro) {
      setErroNovoTempo(
        erro instanceof Error
          ? `${erro.message} Verifique os dados e tente novamente.`
          : 'Não foi possível adicionar o tempo. Tente novamente.',
      );
      inputNovoTempoRef.current?.focus();
    }
  }, [novoTempo, onRecarregar, participante.id]);

  const concluidas = participante.progresso.concluidas;
  const total = participante.progresso.total;

  return (
    <div className="min-h-screen bg-fundo pagina-entrar">
      {/* Cabeçalho */}
      <header className="bg-principal shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <img
            src="/images/logo_principal.png"
            alt="Sentempo"
            className="h-8 object-contain brightness-0 invert"
          />
          <button
            id="btn-sair"
            type="button"
            onClick={onSair}
            className="text-sm text-destaque-claro hover:text-branco transition-colors
              focus-visible:outline-2 focus-visible:outline-destaque rounded px-2 py-1"
          >
            Sair do perfil
          </button>
        </div>
      </header>

      <main id="conteudo-principal" tabIndex={-1} className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Progresso */}
        <CartaoProgresso
          nome={participante.nome}
          concluidas={concluidas}
          total={total}
        />

        {/* Grade de seleção — obrigatório escolher tempo antes da condição */}
        {concluidas < 9 ? (
          <section aria-label="Escolha da combinação" className="bg-branco rounded-2xl border border-destaque-claro p-6 space-y-6">
            <h2 className="text-base font-semibold text-principal">Escolha seu desafio</h2>
            <div
              ref={paginasDesafioRef}
              className="desafio-paginas flex min-w-0 overflow-x-auto snap-x snap-mandatory scroll-smooth"
              aria-label="Etapas de escolha do desafio"
              onScroll={(event) => {
                const container = event.currentTarget;
                const ultimaPagina = container.scrollWidth - container.clientWidth;
                setPaginaDesafio(container.scrollLeft >= ultimaPagina / 2 ? 1 : 0);
              }}
            >
              <div className="desafio-pagina snap-start">
                <SeletorTempo
                  tempoSelecionado={tempoSelecionado}
                  onSelecionar={handleSelecionarTempo}
                />
              </div>
              <div className="desafio-pagina snap-start">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-texto-secundario uppercase tracking-wide">
                    2. Escolha a condição
                  </h3>
                  <button
                    type="button"
                    onClick={() => irParaPaginaDesafio(0)}
                    className="text-xs font-medium text-destaque hover:underline focus-visible:outline-2 focus-visible:outline-destaque rounded"
                  >
                    Alterar tempo
                  </button>
                </div>
                {tempoSelecionado === null && (
                  <p className="mb-3 text-xs text-texto-secundario">
                    Escolha um tempo para ver as condições disponíveis.
                  </p>
                )}
                <SeletorCondicao
                  tempoSelecionado={tempoSelecionado}
                  combinacoes={participante.combinacoes as Combinacao[]}
                  onSelecionar={handleSelecionarCondicao}
                />
              </div>
            </div>
            <div className="flex justify-center gap-2" aria-label="Página do desafio">
              {[0, 1].map((pagina) => (
                <button
                  key={pagina}
                  type="button"
                  onClick={() => irParaPaginaDesafio(pagina)}
                  aria-label={`Ir para ${pagina === 0 ? 'escolha do tempo' : 'escolha da condição'}`}
                  aria-current={paginaDesafio === pagina ? 'step' : undefined}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full"
                >
                  <span
                    aria-hidden="true"
                    className={`h-2.5 w-2.5 rounded-full transition-colors ${
                      paginaDesafio === pagina ? 'bg-principal' : 'bg-borda-controle'
                    }`}
                  />
                </button>
              ))}
            </div>
          </section>
        ) : (
          <div className="bg-destaque-claro rounded-2xl p-6 text-center">
            <p className="text-xl font-semibold text-principal mb-2">🎉 Experimento concluído!</p>
            <p className="text-texto-secundario text-sm">Você completou todas as 9 combinações. Obrigado pela participação!</p>
          </div>
        )}

        {/* Modo Livre */}
        <section aria-label="Modo Livre" className="bg-branco rounded-2xl border border-destaque-claro p-6 space-y-6">
          <h2 className="text-base font-semibold text-principal">Modo Livre</h2>

          {!modoLivre ? (
            <IndicadorCarregamento mensagem="Carregando status do Modo Livre..." compacto />
          ) : !modoLivre.desbloqueado ? (
            <p className="text-texto-secundario text-sm bg-fundo rounded-xl px-4 py-3">
              Realize pelo menos uma atividade oficial de 15 segundos e uma atividade de 30 segundos para desbloquear.
            </p>
          ) : (
            <div className="space-y-4">
              <p className="text-texto-secundario text-sm">Crie tentativas com o tempo que quiser (1 a 120 segundos). Estas tentativas não afetam as estatísticas principais.</p>

              <div className="space-y-2">
                <label htmlFor="input-novo-tempo" className="block text-sm font-medium text-principal">
                  Tempo personalizado em segundos
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    ref={inputNovoTempoRef}
                    id="input-novo-tempo"
                    type="number"
                    min={1}
                    max={120}
                    step={1}
                    value={novoTempo}
                    onChange={(event) => {
                      setNovoTempo(event.target.value);
                      setErroNovoTempo(null);
                    }}
                    aria-invalid={erroNovoTempo !== null}
                    aria-describedby={`ajuda-novo-tempo${erroNovoTempo ? ' erro-novo-tempo' : ''}`}
                    className={`flex-1 px-4 py-2 rounded-xl border bg-branco text-principal text-sm focus:outline-none focus:border-principal ${
                      erroNovoTempo ? 'border-red-600' : 'border-borda-controle'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => { void handleAdicionarTempo(); }}
                    className="px-5 py-2 bg-destaque text-principal font-medium rounded-xl hover:bg-[#00a890] transition-colors"
                  >
                    Adicionar
                  </button>
                </div>
                <p id="ajuda-novo-tempo" className="text-xs text-texto-secundario">
                  Use um número inteiro de 1 a 120.
                </p>
                {erroNovoTempo && (
                  <p id="erro-novo-tempo" role="alert" className="text-xs font-medium text-red-700">
                    {erroNovoTempo}
                  </p>
                )}
              </div>

              {modoLivre.tempos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                  {modoLivre.tempos.map((t) => (
                    <div key={t.id} className="relative group bg-fundo border border-destaque-claro rounded-xl p-3 flex flex-col items-center">
                      <span className="font-semibold text-principal text-lg">{t.tempo_alvo_ms / 1000}s</span>
                      <button
                        type="button"
                        onClick={() => {
                          setTempoParaJogar({ id: t.id, ms: t.tempo_alvo_ms });
                        }}
                        className="mt-2 inline-flex min-h-11 min-w-11 items-center justify-center text-xs text-destaque font-medium hover:underline"
                      >
                        Jogar
                      </button>
                      <button
                        type="button"
                        aria-label={`Excluir tempo personalizado de ${t.tempo_alvo_ms / 1000} segundos`}
                        onClick={() => {
                          setTempoParaExcluir(t.id);
                        }}
                        className="absolute top-0 right-0 inline-flex min-h-11 min-w-11 items-center justify-center text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                      >
                        <span aria-hidden="true">✕</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {(participante.tentativas.length > 0 || (participante.tentativas_livres?.length ?? 0) > 0) && (
          <section aria-label="Resultados">
            <button
              type="button"
              aria-expanded={resultadosAbertos}
              aria-controls="lista-resultados"
              onClick={() => setResultadosAbertos((abertos) => !abertos)}
              className="flex w-full items-center justify-between border-b border-destaque-claro pb-3 text-left text-sm font-semibold uppercase tracking-wide text-texto-secundario"
            >
              <span>Seus resultados</span>
              <span aria-hidden="true" className="text-lg leading-none">
                {resultadosAbertos ? '−' : '+'}
              </span>
            </button>
            {resultadosAbertos && (
              <div id="lista-resultados" className="pt-4 space-y-6">
                {participante.tentativas.length > 0 && (
                  <TabelaResultados
                    tentativas={participante.tentativas}
                    onExcluir={(id) => setTentativaParaExcluir(id)}
                  />
                )}
                {(participante.tentativas_livres?.length ?? 0) > 0 && (
                  <section aria-label="Resultados do Modo Livre">
                    <h3 className="text-sm font-semibold text-texto-secundario uppercase tracking-wide mb-3">
                      Resultados do Modo Livre
                    </h3>
                    <TabelaResultados
                      tentativas={participante.tentativas_livres}
                      onExcluir={(id) => setTentativaParaExcluir(id)}
                    />
                  </section>
                )}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Modais */}

      <ModalConfirmacao
        aberto={tempoParaExcluir !== null}
        titulo="Excluir tempo"
        mensagem="Tem certeza que deseja excluir este tempo personalizado? (Os resultados feitos com ele serão mantidos)"
        textoConfirmar="Sim, excluir"
        tipo="perigo"
        onConfirmar={async () => {
          if (!tempoParaExcluir) return;
          const id = tempoParaExcluir;
          setTempoParaExcluir(null);
          try {
            const { excluirTempoPersonalizado } = await import('../servicos/modo_livre');
            await excluirTempoPersonalizado(participante.id, id);
            await onRecarregar();
          } catch (e) {
            alert('Erro ao excluir tempo');
          }
        }}
        onCancelar={() => setTempoParaExcluir(null)}
      />

      <ModalConfirmacao
        aberto={tentativaParaExcluir !== null}
        titulo="Excluir resultado"
        mensagem="Tem certeza que deseja excluir este resultado?"
        textoConfirmar="Sim, excluir"
        tipo="perigo"
        onConfirmar={async () => {
          if (!tentativaParaExcluir) return;
          const id = tentativaParaExcluir;
          setTentativaParaExcluir(null);
          try {
            const { excluirUma } = await import('../servicos/tentativas');
            await excluirUma(participante.id, id);
            await onRecarregar();
          } catch (e) {
            alert('Erro ao excluir resultado');
          }
        }}
        onCancelar={() => setTentativaParaExcluir(null)}
      />

      <ModalConfirmacao
        aberto={tempoParaJogar !== null}
        titulo="Escolha a condição"
        mensagem={
          <div className="flex flex-col gap-3 mt-4">
            <button
              onClick={() => navigate(`/experimento-livre/${tempoParaJogar!.id}/${tempoParaJogar!.ms}/SEM_ESTIMULO`)}
              className="py-3 px-4 bg-fundo border border-borda-controle rounded-xl hover:bg-destaque-claro text-principal font-medium transition-colors text-left"
            >
              Sem Estímulo
            </button>
            <button
              onClick={() => navigate(`/experimento-livre/${tempoParaJogar!.id}/${tempoParaJogar!.ms}/RAPIDO`)}
              className="py-3 px-4 bg-fundo border border-borda-controle rounded-xl hover:bg-destaque-claro text-principal font-medium transition-colors text-left"
            >
              Estímulo Rápido
            </button>
            <button
              onClick={() => navigate(`/experimento-livre/${tempoParaJogar!.id}/${tempoParaJogar!.ms}/LENTO`)}
              className="py-3 px-4 bg-fundo border border-borda-controle rounded-xl hover:bg-destaque-claro text-principal font-medium transition-colors text-left"
            >
              Estímulo Lento
            </button>
          </div>
        }
        textoConfirmar=""
        textoCancelar="Cancelar"
        onConfirmar={() => { }}
        onCancelar={() => setTempoParaJogar(null)}
      />
    </div>
  );
}

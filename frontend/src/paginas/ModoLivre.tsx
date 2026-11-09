import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { criarTempoPersonalizado, excluirTempoPersonalizado, obterStatusModoLivre } from '../servicos/modo_livre';
import type { ParticipanteDetalhe } from '../tipos/participante';
import type { ContextoModoLivre } from '../componentes/AcessoModoLivre';
import { ModalConfirmacao } from '../componentes/ModalConfirmacao';
import { TabelaResultados } from '../componentes/TabelaResultados';
import { SeletorCondicao } from '../componentes/SeletorCondicao';
import { ErroAPI } from '../servicos/api';

const TEMPOS_CLASSICOS = [5000, 10000, 15000];

interface Props {
  participante: ParticipanteDetalhe;
  onRecarregar: () => Promise<void>;
}

export function ModoLivre({ participante, onRecarregar }: Props) {
  const navigate = useNavigate();
  const { status: modoLivre, atualizar } = useOutletContext<ContextoModoLivre>();
  const inputNovoTempoRef = useRef<HTMLInputElement>(null);
  const [novoTempo, setNovoTempo] = useState('');
  const [erroNovoTempo, setErroNovoTempo] = useState<string | null>(null);
  const [tempoClassico, definirTempoClassico] = useState<number | null>(null);
  const [abrindoClassico, definirAbrindoClassico] = useState(false);
  const [erroClassico, definirErroClassico] = useState<string | null>(null);
  const resultadosJogo = [...participante.tentativas, ...(participante.tentativas_livres ?? [])];
  const temposPersonalizados = modoLivre.tempos.filter(t => !TEMPOS_CLASSICOS.includes(t.tempo_alvo_ms));
  const [tempoParaExcluir, setTempoParaExcluir] = useState<string | null>(null);
  const [tempoParaJogar, setTempoParaJogar] = useState<{ id: string; ms: number } | null>(null);

  useEffect(() => { void onRecarregar(); }, [onRecarregar]);

  const handleAdicionarTempo = useCallback(async () => {
    const valor = Number(novoTempo);
    if (!Number.isInteger(valor) || valor < 1 || valor > 120) {
      setErroNovoTempo('Digite um número inteiro entre 1 e 120 segundos.');
      inputNovoTempoRef.current?.focus();
      return;
    }

    if (TEMPOS_CLASSICOS.includes(valor * 1000)) {
      setErroNovoTempo('Os desafios de 5, 10 e 15 segundos estão disponíveis no modo clássico acima.');
      inputNovoTempoRef.current?.focus();
      return;
    }

    try {
      await criarTempoPersonalizado(participante.id, valor * 1000);
      await atualizar();
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
  }, [novoTempo, atualizar, participante.id]);

  async function jogarClassico(condicao: string) {
    if (tempoClassico === null || abrindoClassico) return;
    definirAbrindoClassico(true);
    definirErroClassico(null);
    try {
      let tempo = modoLivre.tempos.find(t => t.tempo_alvo_ms === tempoClassico);
      if (!tempo) {
        try {
          tempo = await criarTempoPersonalizado(participante.id, tempoClassico);
        } catch (erro) {
          // Outra aba pode ter criado o mesmo tempo enquanto escolhíamos a condição.
          if (!(erro instanceof ErroAPI) || erro.status !== 409) throw erro;
          const status = await obterStatusModoLivre(participante.id);
          tempo = status.tempos.find(t => t.tempo_alvo_ms === tempoClassico);
          if (!tempo) throw erro;
        }
      }
      navigate(`/experimento-livre/${tempo.id}/${tempoClassico}/${condicao}`);
    } catch {
      definirErroClassico('Não foi possível abrir o desafio. Tente novamente.');
    } finally {
      definirAbrindoClassico(false);
    }
  }

  return (
    <div className="min-h-screen bg-fundo pagina-entrar">
      <main id="conteudo-principal" tabIndex={-1} className="max-w-2xl mx-auto px-4 py-8 space-y-8 lg:max-w-6xl lg:px-8 lg:py-12">
        <Link to="/inicio" className="inline-flex min-h-11 items-center underline">Voltar ao início</Link>
        <div className="space-y-3">
          <p className="text-sm font-semibold text-principal">Desbloqueado · agora é hora de brincar</p>
          <h1 className="text-2xl font-semibold lg:text-3xl">Modo livre</h1>
          <p className="text-texto-secundario">Desafie sua percepção do tempo, divirta-se e jogue com amigos. Quem consegue parar mais perto do alvo?</p>
          <p className="text-sm text-texto-secundario">Este modo é fora do estudo, apenas para brincar. As partidas não fazem parte da pesquisa e não alteram suas respostas.</p>
        </div>
        <section aria-labelledby="titulo-classico" className="bg-branco rounded-2xl border border-destaque-claro p-6 space-y-6">
          <div className="space-y-2">
            <h2 id="titulo-classico" className="text-lg font-semibold">Modo clássico</h2>
            <p className="text-sm text-texto-secundario">O jogo no estilo antigo: escolha 5, 10 ou 15 segundos e uma condição. Repita quantas vezes quiser — estas partidas não contam no estudo.</p>
          </div>
          <fieldset disabled={abrindoClassico} className="min-w-0 grid gap-6 lg:grid-cols-2">
            <legend className="sr-only">Configurar desafio clássico</legend>
            <div className="min-w-0 space-y-3">
              <h3 className="text-sm font-semibold text-texto-secundario">1. Escolha o tempo-alvo</h3>
              <div className="grid grid-cols-3 gap-3">
                {TEMPOS_CLASSICOS.map(ms => (
                  <button key={ms} type="button" aria-pressed={tempoClassico === ms} onClick={() => { definirTempoClassico(ms); definirErroClassico(null); }}
                    className={`min-h-14 px-2 py-4 rounded-xl border-2 text-sm font-medium transition-colors disabled:opacity-60 ${tempoClassico === ms ? 'bg-principal border-principal text-branco' : 'bg-branco border-borda-controle text-principal hover:bg-destaque-claro/30'}`}>
                    {ms / 1000} segundos
                  </button>
                ))}
              </div>
            </div>
            <div className="min-w-0 space-y-3">
              <h3 className="text-sm font-semibold text-texto-secundario">2. Escolha a condição</h3>
              <SeletorCondicao tempoSelecionado={tempoClassico} combinacoes={[]} onSelecionar={condicao => { void jogarClassico(condicao); }} />
            </div>
          </fieldset>
          {abrindoClassico && <p role="status" className="text-sm">Abrindo desafio...</p>}
          {erroClassico && <p role="alert" className="text-sm text-red-700">{erroClassico}</p>}
        </section>

        {/* Tempos personalizados */}
        <section aria-label="Modo livre personalizado" className="bg-branco rounded-2xl border border-destaque-claro p-6 space-y-6">
          <h2 className="text-lg font-semibold text-principal">Modo livre personalizado</h2>

          <div className="space-y-4">
            <p className="text-texto-secundario text-sm">Escolha um tempo entre 1 e 120 segundos, selecione os sons e tente chegar o mais perto possível do alvo. Depois, passe a vez para um amigo e comparem os resultados!</p>

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
                  className={`flex-1 min-w-0 px-4 py-2 rounded-xl border bg-branco text-principal text-sm focus:outline-none focus:border-principal ${
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

            {temposPersonalizados.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                {temposPersonalizados.map((t) => (
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
                      className="absolute top-0 right-0 inline-flex min-h-11 min-w-11 items-center justify-center text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      <span aria-hidden="true">✕</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {resultadosJogo.length > 0 && (
          <section aria-labelledby="titulo-resultados-livres" className="space-y-4">
            <h2 id="titulo-resultados-livres" className="text-lg font-semibold">Seus resultados</h2>
            <TabelaResultados tentativas={resultadosJogo} />
          </section>
        )}
      </main>
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
            await excluirTempoPersonalizado(participante.id, id);
            await atualizar();
          } catch {
            setErroNovoTempo('Não foi possível excluir o tempo. Tente novamente.');
          }
        }}
        onCancelar={() => setTempoParaExcluir(null)}
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

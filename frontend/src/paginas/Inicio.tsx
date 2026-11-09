import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { ParticipanteDetalhe } from '../tipos/participante';
import type { ModoLivreStatus } from '../servicos/modo_livre';
import { BarraSuperior } from '../componentes/BarraSuperior';

interface Props {
  participante: ParticipanteDetalhe;
  modoLivre: ModoLivreStatus | null;
  tutorialAberto: boolean;
  onFecharTutorial: () => void;
  onSair: () => void;
  onRecarregar: () => Promise<void>;
}

export function Inicio({ participante, modoLivre, onSair, onRecarregar }: Props) {
  useEffect(() => { void onRecarregar(); }, [onRecarregar]);
  const liberado = modoLivre?.desbloqueado === true;
  const cartao = 'bg-branco rounded-2xl border border-borda-controle p-6 space-y-4 lg:aspect-square lg:min-w-0 lg:flex lg:flex-col lg:items-start lg:gap-4 lg:space-y-0 lg:p-6 xl:p-8';
  const acao = 'inline-flex min-h-12 items-center justify-center rounded-xl px-6 py-3 bg-destaque text-principal font-semibold hover:bg-[#00a890] transition-colors lg:mt-auto';

  return (
    <div className="min-h-screen bg-fundo pagina-entrar">
      <BarraSuperior contexto="Pesquisa de percepção temporal" nome={participante.nome} acao="Sair do perfil" aoAcionar={onSair} />
      <main id="conteudo-principal" tabIndex={-1} className="max-w-2xl mx-auto px-4 py-8 space-y-6 lg:max-w-6xl lg:px-8 lg:py-12 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6 lg:space-y-0">
        <section aria-labelledby="titulo-estudo-a" className={cartao}>
          <p className="text-sm font-semibold text-texto-secundario">{liberado ? 'Pesquisa concluída' : 'Participe da pesquisa'}</p>
          <h1 id="titulo-estudo-a" className="text-xl font-semibold lg:text-3xl">Estudo de percepção temporal</h1>
          <p className="text-texto-secundario leading-relaxed max-w-3xl lg:text-sm lg:leading-6">Uma participação guiada com 9 tentativas e pausas entre três blocos. Você poderá retomar de onde parou.</p>
          <Link to="/estudo-a" className={acao}>{liberado ? 'Ver minha participação' : 'Participar ou retomar estudo'}</Link>
        </section>

        <section aria-labelledby="titulo-modo-livre" className={cartao}>
          <p className="inline-flex items-center gap-2 rounded-full bg-destaque-claro/50 px-3 py-1 text-sm font-semibold" role="status">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0">
              {liberado ? <path d="m5 12 4 4L19 6" /> : <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></>}
            </svg>
            {modoLivre === null ? 'Verificando desbloqueio…' : liberado ? 'Desbloqueado · diversão liberada' : 'Bloqueado · conclua a pesquisa para jogar'}
          </p>
          <h2 id="titulo-modo-livre" className="text-xl font-semibold lg:text-3xl">Jogar modo livre</h2>
          <p className="text-texto-secundario leading-relaxed max-w-3xl lg:text-sm lg:leading-6">Brinque com o tempo! Jogue o modo clássico com 5, 10 e 15 segundos ou crie seus próprios desafios no modo livre. Chame os amigos e jogue quantas vezes quiser. Esta área é fora do estudo, apenas para brincar.</p>
          {!liberado && <p id="bloqueio-modo-livre" className="rounded-xl bg-fundo p-4 text-sm leading-relaxed lg:p-3 lg:leading-5">Conclua o estudo e a etapa final do questionário para desbloquear. Depois, é só chamar os amigos e brincar!</p>}
          {liberado ? (
            <Link to="/modo-livre" className={acao}>Jogar modo livre</Link>
          ) : (
            <div className="lg:mt-auto">
              <button type="button" disabled aria-describedby="bloqueio-modo-livre" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-destaque-claro px-6 py-3 text-principal font-semibold disabled:cursor-not-allowed">Jogar modo livre — bloqueado</button>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

import { useEffect, useId, useRef, useState } from 'react';

interface Props {
  aberto: boolean;
  onFechar: () => void;
}

interface Etapa {
  chamada: string;
  titulo: string;
  conteudo: React.ReactNode;
}

const ETAPAS: Etapa[] = [
  {
    chamada: 'Seu relógio interno entra em cena',
    titulo: 'Bem-vindo ao Sentempo',
    conteudo: (
      <>
        <p>O desafio é simples: perceber a passagem do tempo sem olhar para um relógio.</p>
        <p>Você inicia uma rodada, sente o intervalo passar e toca para parar quando acreditar que o tempo terminou.</p>
      </>
    ),
  },
  {
    chamada: 'Três durações, novas percepções',
    titulo: 'Escolha o intervalo',
    conteudo: (
      <>
        <p>As atividades oficiais usam intervalos de <strong>5, 15 e 30 segundos</strong>.</p>
        <p>Comece pelo tempo que preferir. Cada duração combina com os três modos de estímulo, formando nove desafios.</p>
      </>
    ),
  },
  {
    chamada: 'O ambiente também muda o tempo',
    titulo: 'Experimente os estímulos',
    conteudo: (
      <>
        <p><strong>Sem estímulo</strong> deixa você a sós com a própria percepção.</p>
        <p><strong>Estímulo rápido</strong> e <strong>estímulo lento</strong> adicionam ritmos diferentes para você descobrir como eles influenciam sua estimativa.</p>
      </>
    ),
  },
  {
    chamada: 'Depois, o experimento fica do seu jeito',
    titulo: 'Desbloqueie o Modo Livre',
    conteudo: (
      <>
        <p>Conclua ao menos uma atividade oficial de <strong>15 segundos</strong> e uma de <strong>30 segundos</strong> para liberar o Modo Livre.</p>
        <p>Nele, você cria intervalos personalizados entre 1 e 120 segundos. Essas tentativas não alteram as estatísticas principais.</p>
      </>
    ),
  },
  {
    chamada: 'Tudo pronto para começar',
    titulo: 'Acompanhe sua evolução',
    conteudo: (
      <>
        <p>No início da tela você acompanha o progresso e escolhe primeiro o <strong>tempo</strong>, depois o <strong>estímulo</strong>.</p>
        <p>Após cada rodada, role até <strong>Seus resultados</strong>. Lá ficam suas estimativas, erros e comparações, agrupados por tempo.</p>
      </>
    ),
  },
];

export function TutorialComoFunciona({ aberto, onFechar }: Props) {
  const [etapaAtual, setEtapaAtual] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tituloEtapaRef = useRef<HTMLHeadingElement>(null);
  const tituloDialogoId = useId();
  const total = ETAPAS.length;
  const etapa = ETAPAS[etapaAtual];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (aberto && !dialog.open) {
      setEtapaAtual(0);
      dialog.showModal();
      window.requestAnimationFrame(() => tituloEtapaRef.current?.focus());
    } else if (!aberto && dialog.open) {
      dialog.close();
    }
  }, [aberto]);

  useEffect(() => {
    if (aberto) {
      window.requestAnimationFrame(() => tituloEtapaRef.current?.focus());
    }
  }, [aberto, etapaAtual]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (evento: Event) => {
      evento.preventDefault();
      onFechar();
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onFechar]);

  function avancar() {
    if (etapaAtual === total - 1) {
      onFechar();
      return;
    }
    setEtapaAtual((atual) => atual + 1);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={tituloDialogoId}
      className="m-0 h-[100dvh] max-h-none w-screen max-w-none border-0 bg-fundo p-0 text-principal backdrop:bg-principal/60"
    >
      <div className="flex h-full min-h-0 flex-col">
        <header className="border-b border-destaque-claro bg-branco px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
            <h2 id={tituloDialogoId} className="text-lg font-semibold">Como funciona</h2>
            <button
              type="button"
              onClick={onFechar}
              aria-label="Fechar tutorial"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-fundo text-2xl leading-none text-principal transition-colors hover:bg-destaque-claro"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <div className="mx-auto mt-4 flex max-w-2xl gap-2" aria-hidden="true">
            {ETAPAS.map((item, indice) => (
              <span
                key={item.titulo}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  indice <= etapaAtual ? 'bg-destaque' : 'bg-destaque-claro'
                }`}
              />
            ))}
          </div>
        </header>

        <main className="flex min-h-0 flex-1 items-center overflow-y-auto px-6 py-8">
          <article className="tutorial-etapa mx-auto w-full max-w-xl" key={etapa.titulo}>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-[#00796B]">
              {etapa.chamada}
            </p>
            <h3
              ref={tituloEtapaRef}
              tabIndex={-1}
              className="max-w-lg text-4xl font-semibold leading-[1.12] tracking-tight sm:text-5xl"
            >
              {etapa.titulo}
            </h3>
            <div className="mt-8 max-w-lg space-y-5 text-lg leading-relaxed text-texto-secundario [&_strong]:font-semibold [&_strong]:text-principal">
              {etapa.conteudo}
            </div>
          </article>
        </main>

        <footer className="border-t border-destaque-claro bg-branco px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            {etapaAtual > 0 && (
              <button
                type="button"
                onClick={() => setEtapaAtual((atual) => atual - 1)}
                className="inline-flex min-h-12 items-center justify-center rounded-xl px-4 text-sm font-semibold text-texto-secundario transition-colors hover:bg-fundo hover:text-principal"
              >
                Anterior
              </button>
            )}
            <button
              type="button"
              onClick={avancar}
              className="ml-auto inline-flex min-h-12 min-w-40 items-center justify-center rounded-xl bg-destaque px-6 text-sm font-semibold text-principal shadow-sm transition-colors hover:bg-[#00a890]"
            >
              {etapaAtual === total - 1 ? 'Começar' : 'Próximo'} {etapaAtual + 1}/{total}
            </button>
          </div>
        </footer>
      </div>
    </dialog>
  );
}

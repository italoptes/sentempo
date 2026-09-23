// componentes/BotaoFinalizar.tsx — Botão grande para finalizar rodada

interface Props {
  onClick: () => void;
  desabilitado: boolean;
}

export function BotaoFinalizar({ onClick, desabilitado }: Props) {
  return (
    <button
      id="btn-finalizar"
      type="button"
      onClick={onClick}
      disabled={desabilitado}
      aria-disabled={desabilitado}
      className={`
        w-full max-w-sm py-6 rounded-2xl text-xl font-semibold
        transition-all duration-200 focus-visible:outline-2 focus-visible:outline-destaque
        min-h-[80px] touch-manipulation select-none
        ${desabilitado
          ? 'bg-destaque-claro text-texto-secundario cursor-not-allowed'
          : 'bg-destaque text-principal hover:bg-[#00a890] active:scale-95 shadow-lg shadow-destaque/20 cursor-pointer'
        }
      `}
    >
      {desabilitado ? 'Aguarde...' : 'Finalizar'}
    </button>
  );
}

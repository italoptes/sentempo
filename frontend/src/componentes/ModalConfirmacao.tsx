import { useEffect, useRef } from 'react';

interface Props {
  aberto: boolean;
  titulo: string;
  mensagem: React.ReactNode;
  textoConfirmar?: string;
  textoCancelar?: string;
  tipo?: 'padrao' | 'perigo';
  onConfirmar: () => void;
  onCancelar: () => void;
}

export function ModalConfirmacao({
  aberto,
  titulo,
  mensagem,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  tipo = 'padrao',
  onConfirmar,
  onCancelar,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (aberto) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [aberto]);

  // Evita fechar com ESC sem chamar onCancelar
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onCancelar();
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onCancelar]);

  if (!aberto) return null;

  return (
    <dialog
      ref={dialogRef}
      className="bg-branco p-6 rounded-2xl shadow-xl border border-destaque-claro backdrop:bg-principal/60 backdrop:backdrop-blur-sm fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm m-0"
    >
      <h2 className="text-lg font-semibold text-principal mb-2">{titulo}</h2>
      <div className="text-sm text-texto-secundario mb-6">{mensagem}</div>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancelar}
          className="px-4 py-2 text-sm font-medium text-texto-secundario hover:text-principal transition-colors focus-visible:outline-2 focus-visible:outline-destaque rounded-xl"
        >
          {textoCancelar}
        </button>
        {textoConfirmar && (
          <button
            type="button"
            onClick={onConfirmar}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-destaque shadow-sm ${
              tipo === 'perigo'
                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                : 'bg-destaque text-principal hover:bg-[#00a890]'
            }`}
          >
            {textoConfirmar}
          </button>
        )}
      </div>
    </dialog>
  );
}

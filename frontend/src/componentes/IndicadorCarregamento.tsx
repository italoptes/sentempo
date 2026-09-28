import { Ring } from './loading-ui/Ring';

interface Props {
  mensagem: string;
  compacto?: boolean;
  temaEscuro?: boolean;
}

export function IndicadorCarregamento({ mensagem, compacto = false, temaEscuro = false }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`flex items-center justify-center gap-3 ${
        temaEscuro ? 'text-destaque-claro' : 'text-texto-secundario'
      } ${compacto ? 'text-sm' : 'text-base font-medium'}`}
    >
      <Ring className={compacto ? 'size-4 shrink-0' : 'size-7 shrink-0'} />
      <span>{mensagem}</span>
    </div>
  );
}

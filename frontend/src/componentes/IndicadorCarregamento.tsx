import { useEffect, useState } from 'react';
import { Ring } from './loading-ui/Ring';

interface Props {
  mensagem: string;
  compacto?: boolean;
  temaEscuro?: boolean;
  variante?: 'anel' | 'barra';
  /** Duração em ms para a barra de progresso determinada (variante 'barra'). */
  duracaoMs?: number;
}

export function IndicadorCarregamento({ mensagem, compacto = false, temaEscuro = false, variante = 'anel', duracaoMs = 1000 }: Props) {
  // Controla a largura da barra: inicia em 0% e vai a 100% após a montagem
  const [progresso, setProgresso] = useState(0);

  useEffect(() => {
    if (variante !== 'barra') return;
    // requestAnimationFrame duplo garante que o browser pinte 0% antes de transicionar a 100%
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setProgresso(100);
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [variante]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`flex items-center justify-center gap-3 ${variante === 'barra' ? 'flex-col w-full max-w-xs' : ''} ${
        temaEscuro ? 'text-destaque-claro' : 'text-texto-secundario'
      } ${compacto ? 'text-sm' : 'text-base font-medium'}`}
    >
      {variante === 'anel' && <Ring className={compacto ? 'size-4 shrink-0' : 'size-7 shrink-0'} />}
      <span>{mensagem}</span>
      {variante === 'barra' && (
        <div aria-hidden="true" className="h-2 w-full overflow-hidden rounded-full bg-destaque-claro/20">
          <div
            className="h-full rounded-full bg-destaque"
            style={{
              width: `${progresso}%`,
              transition: `width ${duracaoMs}ms linear`,
            }}
          />
        </div>
      )}
    </div>
  );
}

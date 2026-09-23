// componentes/SeletorTempo.tsx — Seleção de tempo-alvo

import { rotularTempo } from '../utilitarios/formatacao';

const TEMPOS = [5000, 15000, 30000];

interface Props {
  tempoSelecionado: number | null;
  onSelecionar: (tempo: number) => void;
}

export function SeletorTempo({ tempoSelecionado, onSelecionar }: Props) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-texto-secundario uppercase tracking-wide mb-3">
        1. Escolha o tempo-alvo
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {TEMPOS.map((tempo) => {
          const selecionado = tempoSelecionado === tempo;
          return (
            <button
              key={tempo}
              id={`btn-tempo-${tempo}`}
              type="button"
              onClick={() => onSelecionar(tempo)}
              aria-pressed={selecionado}
              className={`
                py-4 px-2 rounded-xl border-2 text-sm font-medium transition-all duration-200
                focus-visible:outline-2 focus-visible:outline-destaque touch-manipulation
                ${selecionado
                  ? 'bg-principal border-principal text-branco shadow-md'
                  : 'bg-branco border-destaque-claro text-principal hover:border-destaque hover:bg-destaque-claro/30'
                }
              `}
            >
              {rotularTempo(tempo)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

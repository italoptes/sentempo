// componentes/SeletorCondicao.tsx — Seleção de condição após escolher tempo

import { rotularCondicao } from '../utilitarios/formatacao';
import type { Combinacao } from '../tipos/participante';

const CONDICOES = ['SEM_ESTIMULO', 'RAPIDO', 'LENTO'];

interface Props {
  tempoSelecionado: number | null;
  combinacoes: Combinacao[];
  onSelecionar: (condicao: string) => void;
}

export function SeletorCondicao({ tempoSelecionado, combinacoes, onSelecionar }: Props) {
  const semTempo = tempoSelecionado === null;

  return (
    <div>
      <h2 className="text-sm font-semibold text-texto-secundario uppercase tracking-wide mb-3">
        2. Escolha a condição
        {semTempo && (
          <span className="ml-2 text-xs font-normal normal-case text-texto-secundario/70">
            (selecione um tempo primeiro)
          </span>
        )}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {CONDICOES.map((condicao) => {
          const combinacao = tempoSelecionado
            ? combinacoes.find(
                (c) => c.tempo_alvo_ms === tempoSelecionado && c.condicao === condicao,
              )
            : undefined;
          const concluida = combinacao?.concluida ?? false;
          const desabilitado = semTempo || concluida;

          return (
            <button
              key={condicao}
              id={`btn-condicao-${condicao}`}
              type="button"
              disabled={desabilitado}
              aria-disabled={desabilitado}
              onClick={() => !desabilitado && onSelecionar(condicao)}
              className={`
                py-4 px-3 rounded-xl border-2 text-sm font-medium transition-all duration-200
                focus-visible:outline-2 focus-visible:outline-destaque touch-manipulation text-left
                ${concluida
                  ? 'bg-destaque-claro border-destaque-claro text-texto-secundario cursor-default'
                  : semTempo
                  ? 'bg-fundo border-destaque-claro/50 text-texto-secundario/50 cursor-not-allowed'
                  : 'bg-branco border-destaque-claro text-principal hover:border-destaque hover:bg-destaque-claro/30 cursor-pointer'
                }
              `}
            >
              <span className="block font-semibold">{rotularCondicao(condicao)}</span>
              {concluida && (
                <span className="block text-xs mt-1 text-destaque font-medium" aria-label="Concluída">
                  ✓ Concluída
                </span>
              )}
              {!concluida && !semTempo && (
                <span className="block text-xs mt-1 text-texto-secundario">Disponível</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

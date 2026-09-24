// paginas/Inicio.tsx — Menu principal do participante (rota /inicio)

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ParticipanteDetalhe, Combinacao } from '../tipos/participante';
import { CartaoProgresso } from '../componentes/CartaoProgresso';
import { SeletorTempo } from '../componentes/SeletorTempo';
import { SeletorCondicao } from '../componentes/SeletorCondicao';
import { TabelaResultados } from '../componentes/TabelaResultados';

interface Props {
  participante: ParticipanteDetalhe;
  onSair: () => void;
  onRecarregar: () => Promise<void>;
}

export function Inicio({ participante, onSair, onRecarregar }: Props) {
  const navigate = useNavigate();
  const [tempoSelecionado, setTempoSelecionado] = useState<number | null>(null);

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
    setTempoSelecionado((prev) => (prev === tempo ? null : tempo));
  }, []);

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

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
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
            <SeletorTempo
              tempoSelecionado={tempoSelecionado}
              onSelecionar={handleSelecionarTempo}
            />
            <SeletorCondicao
              tempoSelecionado={tempoSelecionado}
              combinacoes={participante.combinacoes as Combinacao[]}
              onSelecionar={handleSelecionarCondicao}
            />
          </section>
        ) : (
          <div className="bg-destaque-claro rounded-2xl p-6 text-center">
            <p className="text-xl font-semibold text-principal mb-2">🎉 Experimento concluído!</p>
            <p className="text-texto-secundario text-sm">Você completou todas as 9 combinações. Obrigado pela participação!</p>
          </div>
        )}

        {/* Tabela de resultados */}
        {participante.tentativas.length > 0 && (
          <section aria-label="Resultados">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-texto-secundario uppercase tracking-wide">
                Seus resultados
              </h2>
              <button
                type="button"
                onClick={async () => {
                  if (!window.confirm('Tem certeza que deseja apagar todos os seus resultados e começar de novo?')) return;
                  const { excluirTodas } = await import('../servicos/tentativas');
                  try {
                    await excluirTodas(participante.id);
                    await onRecarregar();
                  } catch (e) {
                    alert('Erro ao apagar resultados');
                  }
                }}
                className="text-xs text-red-500 hover:text-red-700 underline font-medium"
              >
                Refazer experimento
              </button>
            </div>
            <TabelaResultados tentativas={participante.tentativas} />
          </section>
        )}
      </main>
    </div>
  );
}

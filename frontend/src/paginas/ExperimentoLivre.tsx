// paginas/ExperimentoLivre.tsx — Preparação e execução de uma rodada no Modo Livre (rota /experimento-livre/:id/:tempo/:condicao)

import { useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usarExperimento } from '../ganchos/usarExperimento';
import { CirculoEstimulo } from '../componentes/CirculoEstimulo';
import { BotaoFinalizar } from '../componentes/BotaoFinalizar';
import { rotularTempo, rotularCondicao } from '../utilitarios/formatacao';
import type { Condicao } from '../utilitarios/estimulo';

interface Props {
  participanteId: string;
  onRecarregar: () => Promise<void>;
}

export function ExperimentoLivre({ participanteId, onRecarregar }: Props) {
  const navigate = useNavigate();
  const { id: tempoId, tempo: tempoParam, condicao: condicaoParam } = useParams<{ id: string; tempo: string; condicao: string }>();

  const tempoAlvoMs = Number(tempoParam);
  const condicao = condicaoParam as Condicao;

  const { estado, mensagemErro, pulseCount, iniciarRodada, finalizarRodada, limpar } = usarExperimento(participanteId, 'PERSONALIZADA', tempoId);

  // Limpa ao desmontar (parar áudio e agendamentos)
  useEffect(() => {
    return () => { limpar(); };
  }, [limpar]);

  // Navega ao concluir
  useEffect(() => {
    if (estado === 'concluida') {
      void onRecarregar();
      if (mensagemErro === '409') {
        navigate('/inicio', { state: { aviso: 'Esta combinação já havia sido concluída.' } });
      } else {
        navigate('/inicio');
      }
    }
  }, [estado, mensagemErro, navigate, onRecarregar]);

  const handleIniciar = useCallback(async () => {
    await iniciarRodada(condicao);
  }, [iniciarRodada, condicao]);

  const handleFinalizar = useCallback(async () => {
    await finalizarRodada(tempoAlvoMs, condicao);
  }, [finalizarRodada, tempoAlvoMs, condicao]);

  const comEstimulo = condicao === 'RAPIDO' || condicao === 'LENTO';

  // === TELA ATIVA — sem nenhuma informação temporal ===
  if (estado === 'ativa') {
    return (
      <div className="min-h-screen bg-principal flex flex-col items-center justify-center px-4 py-12 gap-12">
        {/* Estímulo visual (somente para RAPIDO e LENTO) */}
        <CirculoEstimulo pulseCount={pulseCount} visivel={comEstimulo} />

        {/* Botão de finalizar — área de toque confortável */}
        <BotaoFinalizar onClick={handleFinalizar} desabilitado={false} />
      </div>
    );
  }

  // === FINALIZANDO ===
  if (estado === 'finalizando') {
    return (
      <div className="min-h-screen bg-principal flex items-center justify-center">
        <p className="text-destaque-claro text-lg font-medium animate-pulse">Salvando...</p>
      </div>
    );
  }

  // === ERRO DE ÁUDIO ===
  if (estado === 'erro-audio') {
    return (
      <div className="min-h-screen bg-fundo flex flex-col items-center justify-center px-4 py-12 pagina-entrar">
        <div className="bg-branco rounded-2xl border border-red-200 p-8 max-w-md w-full text-center space-y-4">
          <div className="text-4xl">🔇</div>
          <h1 className="text-lg font-semibold text-principal">Falha no áudio</h1>
          <p className="text-texto-secundario text-sm">{mensagemErro}</p>
          <button
            type="button"
            onClick={() => navigate('/inicio')}
            className="w-full py-3 bg-principal text-branco font-medium rounded-xl hover:bg-[#0a2021] transition-colors"
          >
            Voltar ao menu
          </button>
        </div>
      </div>
    );
  }

  // === ERRO DE REDE ===
  if (estado === 'erro-rede') {
    return (
      <div className="min-h-screen bg-fundo flex flex-col items-center justify-center px-4 py-12 pagina-entrar">
        <div className="bg-branco rounded-2xl border border-orange-200 p-8 max-w-md w-full text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-lg font-semibold text-principal">Resultado não confirmado</h1>
          <p className="text-texto-secundario text-sm">{mensagemErro}</p>
          <button
            type="button"
            onClick={() => navigate('/inicio')}
            className="w-full py-3 bg-principal text-branco font-medium rounded-xl hover:bg-[#0a2021] transition-colors"
          >
            Voltar ao menu
          </button>
        </div>
      </div>
    );
  }

  // === PREPARAÇÃO ===
  return (
    <div className="min-h-screen bg-fundo flex flex-col pagina-entrar">
      <header className="bg-principal shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <img src="/images/icone_sentempo.png" alt="Sentempo" className="h-7 w-7 object-contain" />
          <span className="text-destaque-claro text-sm font-medium">Modo Livre - Preparação</span>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto px-4 py-10 space-y-8 w-full">
        <div className="bg-branco rounded-2xl border border-destaque-claro p-6 space-y-4">
          {/* Informações da combinação */}
          <div className="flex gap-3 flex-wrap">
            <span className="inline-block bg-destaque-claro text-principal text-xs font-semibold px-3 py-1 rounded-full">
              {rotularTempo(tempoAlvoMs)}
            </span>
            <span className="inline-block bg-principal text-destaque-claro text-xs font-semibold px-3 py-1 rounded-full">
              {rotularCondicao(condicao)}
            </span>
            <span className="inline-block border border-destaque text-destaque text-xs font-semibold px-3 py-1 rounded-full">
              LIVRE
            </span>
          </div>

          <h1 className="text-xl font-semibold text-principal">
            Quando você acreditar que o tempo terminou, toque em <strong>Finalizar</strong>.
          </h1>

          {/* Instrução sobre estímulo */}
          {comEstimulo ? (
            <p className="text-texto-secundario text-sm bg-destaque-claro/30 rounded-xl px-4 py-3">
              Durante esta rodada você ouvirá <strong>pulsos sonoros curtos</strong> e verá um <strong>círculo pulsante</strong>.
              Use fones de ouvido para melhor experiência.
            </p>
          ) : (
            <p className="text-texto-secundario text-sm bg-fundo rounded-xl px-4 py-3">
              Esta rodada é <strong>sem estímulo</strong>: não haverá sons nem círculo pulsante.
            </p>
          )}

          <p className="text-xs text-texto-secundario">
            Não haverá cronômetro, contagem regressiva ou barra de progresso durante a rodada.
          </p>
        </div>

        {/* Botões de ação */}
        <div className="space-y-3">
          <button
            id="btn-iniciar-rodada"
            type="button"
            onClick={handleIniciar}
            disabled={estado !== 'preparacao'}
            className="w-full py-4 bg-destaque text-principal font-semibold rounded-xl
              hover:bg-[#00a890] active:scale-95 transition-all duration-200
              focus-visible:outline-2 focus-visible:outline-destaque
              disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {estado === 'preparacao' ? 'Iniciar rodada' : 'Iniciando...'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/inicio')}
            disabled={estado !== 'preparacao'}
            className="w-full py-3 text-texto-secundario text-sm hover:text-principal
              transition-colors focus-visible:outline-2 focus-visible:outline-destaque rounded-xl"
          >
            ← Voltar ao menu
          </button>
        </div>
      </main>
    </div>
  );
}

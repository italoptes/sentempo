// Aplicacao.tsx — Roteador e estado global da aplicação

import { Navigate, Route, Routes } from 'react-router-dom';
import { usarParticipante } from './ganchos/usarParticipante';
import { Entrada } from './paginas/Entrada';
import { Inicio } from './paginas/Inicio';
import { ExperimentoLivre } from './paginas/ExperimentoLivre';
import { Administracao } from './paginas/Administracao';
import { PWAModal } from './componentes/PWAModal';
import { TituloPagina } from './componentes/TituloPagina';
import { IndicadorCarregamento } from './componentes/IndicadorCarregamento';
import { GerenciadorFocoRota } from './componentes/GerenciadorFocoRota';
import { EstudoA } from './paginas/EstudoA';
import { ModoLivre } from './paginas/ModoLivre';
import { AcessoModoLivre } from './componentes/AcessoModoLivre';

export function Aplicacao() {
  const {
    participanteId,
    detalhe,
    carregando,
    modoLivre,
    tutorialAberto,
    definirParticipante,
    fecharTutorial,
    sair,
    recarregar,
  } = usarParticipante();

  return (
    <>
      <TituloPagina />
      <GerenciadorFocoRota />
      <a href="#conteudo-principal" className="link-pular-conteudo">
        Ir para o conteúdo principal
      </a>
      <Routes>
        {/* Entrada */}
        <Route
          path="/"
          element={
            participanteId && detalhe ? (
              <Navigate to="/inicio" replace />
            ) : (
              <Entrada onParticipanteDefinido={definirParticipante} />
            )
          }
        />

        {/* Menu do participante */}
        <Route
          path="/inicio"
          element={
            !participanteId ? (
              <Navigate to="/" replace />
            ) : carregando && !detalhe ? (
              <div id="conteudo-principal" tabIndex={-1} className="min-h-screen bg-fundo flex items-center justify-center">
                <IndicadorCarregamento mensagem="Carregando perfil..." />
              </div>
            ) : detalhe ? (
              <Inicio
                participante={detalhe}
                modoLivre={modoLivre}
                tutorialAberto={tutorialAberto}
                onFecharTutorial={fecharTutorial}
                onSair={sair}
                onRecarregar={recarregar}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route path="/estudo-a" element={participanteId ? <EstudoA participanteId={participanteId} /> : <Navigate to="/" replace />} />

        {/* Links antigos levam à área de jogo, sem registrar novas tentativas oficiais. */}
        <Route path="/experimento/:tempo/:condicao" element={<Navigate to="/modo-livre" replace />} />

        {/* A página de jogo e suas partidas exigem pesquisa concluída. */}
        <Route element={participanteId ? <AcessoModoLivre participanteId={participanteId} /> : <Navigate to="/" replace />}>
          <Route path="/modo-livre" element={detalhe ? <ModoLivre participante={detalhe} onRecarregar={recarregar} /> : <IndicadorCarregamento mensagem="Carregando perfil..." />} />
          <Route path="/experimento-livre/:id/:tempo/:condicao" element={participanteId ? <ExperimentoLivre participanteId={participanteId} onRecarregar={recarregar} /> : <Navigate to="/" replace />} />
        </Route>

        {/* Administração */}
        <Route path="/administracao" element={<Administracao />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <PWAModal />
    </>
  );
}

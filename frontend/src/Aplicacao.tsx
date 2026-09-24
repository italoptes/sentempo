// Aplicacao.tsx — Roteador e estado global da aplicação

import { Navigate, Route, Routes } from 'react-router-dom';
import { usarParticipante } from './ganchos/usarParticipante';
import { Entrada } from './paginas/Entrada';
import { Inicio } from './paginas/Inicio';
import { Experimento } from './paginas/Experimento';
import { ExperimentoLivre } from './paginas/ExperimentoLivre';
import { Administracao } from './paginas/Administracao';
import { PWAModal } from './componentes/PWAModal';

export function Aplicacao() {
  const {
    participanteId,
    detalhe,
    carregando,
    modoLivre,
    definirParticipante,
    sair,
    recarregar,
  } = usarParticipante();

  return (
    <>
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
              <div className="min-h-screen bg-fundo flex items-center justify-center">
                <p className="text-texto-secundario animate-pulse">Carregando perfil...</p>
              </div>
            ) : detalhe ? (
              <Inicio
                participante={detalhe}
                modoLivre={modoLivre}
                onSair={sair}
                onRecarregar={recarregar}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Experimento */}
        <Route
          path="/experimento/:tempo/:condicao"
          element={
            !participanteId ? (
              <Navigate to="/" replace />
            ) : (
              <Experimento
                participanteId={participanteId}
                onRecarregar={recarregar}
              />
            )
          }
        />

        {/* Experimento Livre */}
        <Route
          path="/experimento-livre/:id/:tempo/:condicao"
          element={
            !participanteId ? (
              <Navigate to="/" replace />
            ) : (
              <ExperimentoLivre
                participanteId={participanteId}
                onRecarregar={recarregar}
              />
            )
          }
        />

        {/* Administração */}
        <Route path="/administracao" element={<Administracao />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <PWAModal />
    </>
  );
}

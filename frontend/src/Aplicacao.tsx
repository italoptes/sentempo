// Aplicacao.tsx — Roteador e estado global da aplicação

import { Navigate, Route, Routes } from 'react-router-dom';
import { usarParticipante } from './ganchos/usarParticipante';
import { Entrada } from './paginas/Entrada';
import { Inicio } from './paginas/Inicio';
import { Experimento } from './paginas/Experimento';
import { ExperimentoLivre } from './paginas/ExperimentoLivre';
import { Administracao } from './paginas/Administracao';
import { PWAModal } from './componentes/PWAModal';
import { TituloPagina } from './componentes/TituloPagina';
import { IndicadorCarregamento } from './componentes/IndicadorCarregamento';

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
      <TituloPagina />
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

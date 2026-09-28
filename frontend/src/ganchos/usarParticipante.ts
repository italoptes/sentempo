// ganchos/usarParticipante.ts — Gerencia sessão do participante

import { useCallback, useEffect, useState } from 'react';
import type { ParticipanteDetalhe } from '../tipos/participante';
import type { ModoLivreStatus } from '../servicos/modo_livre';
import { consultarParticipante } from '../servicos/participantes';

const CHAVE_ID = 'sentempo_participante_id';
const CHAVE_TUTORIAL = 'sentempo_tutorial_pendente';

export function usarParticipante() {
  const [participanteId, setParticipanteId] = useState<string | null>(
    () => sessionStorage.getItem(CHAVE_ID),
  );
  const [detalhe, setDetalhe] = useState<ParticipanteDetalhe | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [tutorialAberto, setTutorialAberto] = useState(() => {
    const tutorialPendente = sessionStorage.getItem(CHAVE_TUTORIAL);
    return tutorialPendente !== null && tutorialPendente === sessionStorage.getItem(CHAVE_ID);
  });

  const [modoLivre, setModoLivre] = useState<ModoLivreStatus | null>(null);

  const definirParticipante = useCallback((id: string, novoParticipante = false) => {
    sessionStorage.setItem(CHAVE_ID, id);
    if (novoParticipante) {
      sessionStorage.setItem(CHAVE_TUTORIAL, id);
    } else {
      sessionStorage.removeItem(CHAVE_TUTORIAL);
    }
    setParticipanteId(id);
    setTutorialAberto(novoParticipante);
  }, []);

  const fecharTutorial = useCallback(() => {
    sessionStorage.removeItem(CHAVE_TUTORIAL);
    setTutorialAberto(false);
  }, []);

  const sair = useCallback(() => {
    sessionStorage.removeItem(CHAVE_ID);
    sessionStorage.removeItem(CHAVE_TUTORIAL);
    setParticipanteId(null);
    setDetalhe(null);
    setModoLivre(null);
    setTutorialAberto(false);
  }, []);

  const recarregar = useCallback(async () => {
    if (!participanteId) return;
    setCarregando(true);
    setErro(null);
    try {
      const dados = await consultarParticipante(participanteId);
      setDetalhe(dados);
      try {
        const { obterStatusModoLivre } = await import('../servicos/modo_livre');
        const statusModo = await obterStatusModoLivre(participanteId);
        setModoLivre(statusModo);
      } catch (e) {
        console.error('Erro ao carregar status do Modo Livre', e);
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar participante');
    } finally {
      setCarregando(false);
    }
  }, [participanteId]);

  useEffect(() => {
    if (participanteId) {
      void recarregar();
    }
  }, [participanteId, recarregar]);

  return {
    participanteId,
    detalhe,
    carregando,
    erro,
    modoLivre,
    tutorialAberto,
    definirParticipante,
    fecharTutorial,
    sair,
    recarregar,
  };
}

// ganchos/usarParticipante.ts — Gerencia sessão do participante

import { useCallback, useEffect, useState } from 'react';
import type { ParticipanteDetalhe } from '../tipos/participante';
import { consultarParticipante } from '../servicos/participantes';

const CHAVE_ID = 'sentempo_participante_id';

export function usarParticipante() {
  const [participanteId, setParticipanteId] = useState<string | null>(
    () => sessionStorage.getItem(CHAVE_ID),
  );
  const [detalhe, setDetalhe] = useState<ParticipanteDetalhe | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const definirParticipante = useCallback((id: string) => {
    sessionStorage.setItem(CHAVE_ID, id);
    setParticipanteId(id);
  }, []);

  const sair = useCallback(() => {
    sessionStorage.removeItem(CHAVE_ID);
    setParticipanteId(null);
    setDetalhe(null);
  }, []);

  const recarregar = useCallback(async () => {
    if (!participanteId) return;
    setCarregando(true);
    setErro(null);
    try {
      const dados = await consultarParticipante(participanteId);
      setDetalhe(dados);
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

  return { participanteId, detalhe, carregando, erro, definirParticipante, sair, recarregar };
}

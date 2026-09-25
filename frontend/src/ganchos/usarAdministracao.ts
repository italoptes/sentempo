// ganchos/usarAdministracao.ts — Gerencia autenticação administrativa

import { useCallback, useState } from 'react';
import type { ResumoAdministracao, EstatisticasResposta, PaginaParticipantes } from '../tipos/administracao';
import {
  loginAdministracao,
  obterResumo,
  obterEstatisticas,
  listarParticipantes,
} from '../servicos/administracao';
import { ErroAPI } from '../servicos/api';

const CHAVE_TOKEN = 'sentempo_admin_token';

export function usarAdministracao() {
  // Token em sessionStorage (não localStorage)
  const [token, setToken] = useState<string | null>(
    () => sessionStorage.getItem(CHAVE_TOKEN),
  );
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resumo, setResumo] = useState<ResumoAdministracao | null>(null);
  const [estatisticasCondicao, setEstatisticasCondicao] = useState<EstatisticasResposta | null>(null);
  const [estatisticasTempo, setEstatisticasTempo] = useState<EstatisticasResposta | null>(null);
  const [estatisticasTempoCondicao, setEstatisticasTempoCondicao] = useState<EstatisticasResposta | null>(null);
  const [pagina, setPagina] = useState<PaginaParticipantes | null>(null);

  const autenticado = token !== null;

  const login = useCallback(async (nome: string, codigo: string): Promise<boolean> => {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await loginAdministracao(nome, codigo);
      sessionStorage.setItem(CHAVE_TOKEN, resposta.token_acesso);
      setToken(resposta.token_acesso);
      return true;
    } catch (e) {
      const msg = e instanceof ErroAPI && e.status === 401
        ? 'Credenciais inválidas.'
        : (e instanceof Error ? e.message : 'Erro ao autenticar');
      setErro(msg);
      return false;
    } finally {
      setCarregando(false);
    }
  }, []);

  const sair = useCallback(() => {
    sessionStorage.removeItem(CHAVE_TOKEN);
    setToken(null);
    setResumo(null);
    setEstatisticasCondicao(null);
    setEstatisticasTempo(null);
    setEstatisticasTempoCondicao(null);
    setPagina(null);
  }, []);

  const tratarErroToken = useCallback((e: unknown) => {
    if (e instanceof ErroAPI && e.status === 401) {
      sair();
      return 'Sessão expirada. Faça login novamente.';
    }
    return e instanceof Error ? e.message : 'Erro desconhecido';
  }, [sair]);

  const carregarResumo = useCallback(async () => {
    if (!token) return;
    setCarregando(true);
    setErro(null);
    try {
      const [r, ec, et, etc] = await Promise.all([
        obterResumo(token),
        obterEstatisticas(token, 'condicao'),
        obterEstatisticas(token, 'tempo'),
        obterEstatisticas(token, 'tempo_condicao'),
      ]);
      setResumo(r);
      setEstatisticasCondicao(ec);
      setEstatisticasTempo(et);
      setEstatisticasTempoCondicao(etc);
    } catch (e) {
      setErro(tratarErroToken(e));
    } finally {
      setCarregando(false);
    }
  }, [token, tratarErroToken]);

  const carregarParticipantes = useCallback(
    async (numeroPagina: number, tamanho: number, busca?: string) => {
      if (!token) return;
      setCarregando(true);
      setErro(null);
      try {
        const dados = await listarParticipantes(token, numeroPagina, tamanho, busca);
        setPagina(dados);
      } catch (e) {
        setErro(tratarErroToken(e));
      } finally {
        setCarregando(false);
      }
    },
    [token, tratarErroToken],
  );

  return {
    token,
    autenticado,
    carregando,
    erro,
    resumo,
    estatisticasCondicao,
    estatisticasTempo,
    estatisticasTempoCondicao,
    pagina,
    login,
    sair,
    carregarResumo,
    carregarParticipantes,
  };
}

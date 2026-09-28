import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function obterTitulo(caminho: string): string {
  if (caminho === '/') return 'Entrar no experimento — Sentempo';
  if (caminho === '/inicio') return 'Início — Sentempo';
  if (caminho.startsWith('/experimento-livre/')) return 'Experimento livre — Sentempo';
  if (caminho.startsWith('/experimento/')) return 'Preparação do experimento — Sentempo';
  if (caminho === '/administracao') return 'Administração — Sentempo';
  return 'Sentempo';
}

export function TituloPagina() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = obterTitulo(pathname);
  }, [pathname]);

  return null;
}

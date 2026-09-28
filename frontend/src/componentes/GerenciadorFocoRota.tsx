import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export function GerenciadorFocoRota() {
  const { pathname } = useLocation();
  const caminhoAnterior = useRef(pathname);

  useEffect(() => {
    if (caminhoAnterior.current === pathname) return;
    caminhoAnterior.current = pathname;

    const quadro = window.requestAnimationFrame(() => {
      document.getElementById('conteudo-principal')?.focus();
    });

    return () => window.cancelAnimationFrame(quadro);
  }, [pathname]);

  return null;
}

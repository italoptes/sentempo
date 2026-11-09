import { useCallback, useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { obterStatusModoLivre } from '../servicos/modo_livre';
import type { ModoLivreStatus } from '../servicos/modo_livre';
import { IndicadorCarregamento } from './IndicadorCarregamento';

export interface ContextoModoLivre {
  status: ModoLivreStatus;
  atualizar: () => Promise<void>;
}

export function AcessoModoLivre({ participanteId }: { participanteId: string }) {
  const { pathname } = useLocation();
  return <VerificacaoModoLivre key={`${participanteId}:${pathname}`} participanteId={participanteId} />;
}

function VerificacaoModoLivre({ participanteId }: { participanteId: string }) {
  const [status, definirStatus] = useState<ModoLivreStatus | null>(null);
  const [erro, definirErro] = useState(false);
  const atualizar = useCallback(async () => {
    // Só atualiza a tela depois de confirmar o acesso com o servidor.
    const resposta = await obterStatusModoLivre(participanteId);
    definirStatus(resposta);
    definirErro(false);
  }, [participanteId]);

  useEffect(() => {
    let presente = true;
    obterStatusModoLivre(participanteId)
      .then(resposta => { if (presente) definirStatus(resposta); })
      .catch(() => { if (presente) definirErro(true); });
    return () => { presente = false; };
  }, [participanteId]);

  if (status?.desbloqueado && !erro) return <Outlet context={{ status, atualizar } satisfies ContextoModoLivre} />;

  return (
    <main id="conteudo-principal" tabIndex={-1} className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <Link to="/inicio" className="inline-flex min-h-11 items-center underline">Voltar ao início</Link>
      <h1 className="text-2xl font-semibold">Modo livre</h1>
      {erro ? (
        <div role="alert" className="space-y-4">
          <p>Não foi possível verificar o desbloqueio. Confira sua conexão e tente novamente.</p>
          <button type="button" className="min-h-12 rounded-xl bg-destaque px-6 py-3 font-semibold" onClick={() => { void atualizar().catch(() => definirErro(true)); }}>Tentar novamente</button>
        </div>
      ) : !status ? <IndicadorCarregamento mensagem="Verificando desbloqueio do modo livre..." /> : (
        <section className="rounded-2xl border border-borda-controle bg-branco p-6 space-y-4">
          <h2 className="text-lg font-semibold">Bloqueado · conclua a pesquisa para jogar</h2>
          <p>Complete as 9 tentativas do estudo de percepção temporal e a etapa final do questionário para liberar o modo livre. Depois, crie desafios e divirta-se com os amigos!</p>
          <Link to="/estudo-a" className="inline-flex min-h-12 items-center rounded-xl bg-destaque px-6 py-3 font-semibold">Concluir pesquisa e desbloquear</Link>
        </section>
      )}
    </main>
  );
}

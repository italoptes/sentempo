interface Props {
  contexto: string;
  nome?: string;
  acao: string;
  aoAcionar?: () => void;
  destino?: string;
}

function iniciais(nome: string) {
  return nome.trim().split(/\s+/).slice(0, 2).map(parte => parte[0]).join('').toUpperCase();
}

export function BarraSuperior({ contexto, nome, acao, aoAcionar, destino }: Props) {
  const acaoClasse = 'inline-flex min-h-11 items-center gap-2 rounded-xl border border-branco/15 bg-branco/10 px-3 text-sm font-medium text-destaque-claro transition-colors hover:bg-branco/15 hover:text-branco';
  return <header className="sticky top-0 z-10 border-b-2 border-destaque/70 bg-principal shadow-sm">
    <div className="mx-auto flex min-h-[4.75rem] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <a href="/inicio" className="flex shrink-0 items-center" aria-label="Ir para o início">
          <img src="/images/logo_principal.png" alt="Sentempo" className="h-9 object-contain brightness-0 invert" />
        </a>
        <span className="hidden h-7 w-px bg-branco/20 sm:block" aria-hidden="true" />
        <span className="hidden truncate text-sm text-destaque-claro sm:block">{contexto}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {nome && <div className="hidden items-center gap-2 rounded-full border border-destaque-claro/25 bg-branco/5 py-1 pl-1 pr-3 text-sm text-destaque-claro md:flex">
          <span className="grid size-7 place-items-center rounded-full bg-destaque text-xs font-bold text-principal">{iniciais(nome)}</span>
          <span className="max-w-36 truncate">{nome}</span>
        </div>}
        {destino ? <a href={destino} className={acaoClasse}>{acao}</a> : <button id="btn-sair" type="button" onClick={aoAcionar} className={acaoClasse}>{acao}</button>}
      </div>
    </div>
  </header>;
}

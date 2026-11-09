export function MetricasAdministracao({ itens }: { itens: [string, number][] }) {
  return <dl className="grid grid-cols-3 divide-x divide-destaque-claro rounded-2xl border border-destaque-claro bg-branco">
    {itens.map(([rotulo, valor]) => <div key={rotulo} className="min-w-0 p-3 sm:p-5">
      <dt className="text-xs leading-5 text-texto-secundario sm:text-sm">{rotulo}</dt>
      <dd className="mt-2 text-2xl sm:text-3xl font-semibold tabular-nums">{valor}</dd>
    </div>)}
  </dl>;
}

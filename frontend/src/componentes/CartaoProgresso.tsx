// componentes/CartaoProgresso.tsx — Card de progresso do participante

interface Props {
  nome: string;
  concluidas: number;
  total: number;
}

export function CartaoProgresso({ nome, concluidas, total }: Props) {
  const porcentagem = Math.round((concluidas / total) * 100);

  return (
    <div className="bg-branco rounded-2xl shadow-sm border border-destaque-claro p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-texto-secundario text-sm mb-1">Participante</p>
          <h1 className="text-2xl font-semibold text-principal">{nome}</h1>
        </div>
        <div className="text-right">
          <p className="text-3xl font-semibold text-destaque">{concluidas}</p>
          <p className="text-texto-secundario text-sm">de {total} tentativas</p>
        </div>
      </div>

      {/* Barra de progresso visual (apenas decorativa — não é cronômetro) */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-texto-secundario mb-1">
          <span>{concluidas} concluídas</span>
          <span>{porcentagem}%</span>
        </div>
        <div className="h-2 bg-destaque-claro rounded-full overflow-hidden" role="progressbar"
          aria-valuenow={concluidas} aria-valuemin={0} aria-valuemax={total}
          aria-label={`${concluidas} de ${total} tentativas concluídas`}>
          <div
            className="h-full bg-destaque rounded-full transition-all duration-500"
            style={{ width: `${porcentagem}%` }}
          />
        </div>
      </div>
    </div>
  );
}

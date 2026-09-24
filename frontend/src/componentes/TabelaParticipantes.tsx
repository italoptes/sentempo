// componentes/TabelaParticipantes.tsx — Lista paginada de participantes (área admin)

import { useState } from 'react';
import type { PaginaParticipantes } from '../tipos/administracao';
import { formatarData } from '../utilitarios/formatacao';

interface Props {
  pagina: PaginaParticipantes;
  onPaginar: (p: number) => void;
  onBuscar: (busca: string) => void;
  onDetalhar: (id: string) => void;
  onExcluirConta: (id: string) => void;
  carregando: boolean;
}

export function TabelaParticipantes({ pagina, onPaginar, onBuscar, onDetalhar, onExcluirConta, carregando }: Props) {
  const [busca, setBusca] = useState('');

  function handleBusca(e: React.FormEvent) {
    e.preventDefault();
    onBuscar(busca);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleBusca} className="flex flex-col sm:flex-row gap-2">
        <input
          id="campo-busca-participante"
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome..."
          className="flex-1 px-4 py-2 rounded-xl border border-destaque-claro bg-branco text-principal
            focus:outline-none focus:border-destaque focus:ring-1 focus:ring-destaque text-sm"
          aria-label="Buscar participante por nome"
        />
        <button
          type="submit"
          disabled={carregando}
          className="px-5 py-2 bg-principal text-branco rounded-xl text-sm font-medium
            hover:bg-[#0a2021] transition-colors focus-visible:outline-2 focus-visible:outline-destaque"
        >
          Buscar
        </button>
      </form>

      {/* Visão de Cards para Celular */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {pagina.itens.length === 0 ? (
          <p className="text-center text-texto-secundario italic py-4">
            Nenhum participante encontrado.
          </p>
        ) : (
          pagina.itens.map((item) => (
            <div key={item.id} className="bg-branco rounded-xl border border-destaque-claro p-4 space-y-3 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-principal font-semibold">{item.nome}</p>
                  <p className="text-texto-secundario text-xs font-mono">{item.codigo}</p>
                </div>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium
                  ${item.situacao === 'COMPLETO' ? 'bg-destaque-claro text-principal' : 'bg-fundo text-texto-secundario border border-destaque-claro'}`}>
                  {item.situacao === 'COMPLETO' ? '✓ Completo' : 'Incompleto'}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-texto-secundario">Tentativas:</span>
                <span className="font-medium text-principal">{item.tentativas_concluidas}/9</span>
              </div>
              
              <div className="flex justify-between items-center text-xs text-texto-secundario">
                <span>Criado em:</span>
                <span>{formatarData(item.criado_em)}</span>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-destaque-claro/50 mt-2">
                <button
                  type="button"
                  onClick={() => onExcluirConta(item.id)}
                  className="text-red-500 hover:text-red-700 transition-colors text-sm font-medium"
                >
                  Excluir
                </button>
                <button
                  type="button"
                  onClick={() => onDetalhar(item.id)}
                  className="text-destaque font-medium hover:underline text-sm"
                >
                  Ver detalhes
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Visão de Tabela para Desktop */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-destaque-claro shadow-sm">
        <table className="w-full text-sm whitespace-nowrap" aria-label="Lista de participantes">
          <thead>
            <tr className="bg-destaque-claro text-principal">
              <th scope="col" className="px-4 py-3 text-left font-semibold">Nome</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Código</th>
              <th scope="col" className="px-4 py-3 text-center font-semibold">Tentativas</th>
              <th scope="col" className="px-4 py-3 text-center font-semibold">Situação</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Criado em</th>
              <th scope="col" className="px-4 py-3 text-center font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {pagina.itens.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-texto-secundario italic">
                  Nenhum participante encontrado.
                </td>
              </tr>
            ) : (
              pagina.itens.map((item) => (
                <tr key={item.id} className="border-t border-destaque-claro hover:bg-fundo transition-colors">
                  <td className="px-4 py-3">{item.nome}</td>
                  <td className="px-4 py-3 font-mono">{item.codigo}</td>
                  <td className="px-4 py-3 text-center">{item.tentativas_concluidas}/9</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium
                      ${item.situacao === 'COMPLETO' ? 'bg-destaque-claro text-principal' : 'bg-fundo text-texto-secundario border border-destaque-claro'}`}>
                      {item.situacao === 'COMPLETO' ? '✓ Completo' : 'Incompleto'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-texto-secundario text-xs">{formatarData(item.criado_em)}</td>
                  <td className="px-4 py-3 text-center flex justify-center gap-2 items-center">
                    <button
                      type="button"
                      onClick={() => onDetalhar(item.id)}
                      className="text-destaque text-xs font-medium hover:underline focus-visible:outline-2 focus-visible:outline-destaque rounded"
                    >
                      Ver
                    </button>
                    <button
                      type="button"
                      onClick={() => onExcluirConta(item.id)}
                      className="text-red-500 hover:text-red-700 transition-colors text-xs font-medium hover:underline
                        focus-visible:outline-2 focus-visible:outline-destaque rounded"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {pagina.total_paginas > 1 && (
        <div className="flex items-center justify-between text-sm text-texto-secundario">
          <span>
            {pagina.total_itens} participante{pagina.total_itens !== 1 ? 's' : ''} • Página {pagina.pagina} de {pagina.total_paginas}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pagina.pagina <= 1 || carregando}
              onClick={() => onPaginar(pagina.pagina - 1)}
              className="px-3 py-1 rounded-lg border border-destaque-claro disabled:opacity-40
                hover:bg-destaque-claro transition-colors focus-visible:outline-2 focus-visible:outline-destaque"
            >
              ← Anterior
            </button>
            <button
              type="button"
              disabled={pagina.pagina >= pagina.total_paginas || carregando}
              onClick={() => onPaginar(pagina.pagina + 1)}
              className="px-3 py-1 rounded-lg border border-destaque-claro disabled:opacity-40
                hover:bg-destaque-claro transition-colors focus-visible:outline-2 focus-visible:outline-destaque"
            >
              Próxima →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

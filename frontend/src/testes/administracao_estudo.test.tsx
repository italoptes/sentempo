import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { AdministracaoEstudo } from '../componentes/AdministracaoEstudo';
import { requisicao } from '../servicos/api';

vi.mock('../servicos/api', () => ({ requisicao: vi.fn() }));
vi.mock('../servicos/administracao', () => ({ baixarCSV: vi.fn().mockResolvedValue(undefined) }));
afterEach(cleanup);

it('consulta a versão fornecida pelo seletor central sem misturar nove e 27 tentativas', async () => {
  vi.mocked(requisicao).mockImplementation(async caminho => ({
    versao_protocolo: caminho.includes('ESTUDO_A_V1') ? 'ESTUDO_A_V1' : 'ESTUDO_A_V2',
    sessoes_total: 0, sessoes_completas: 0, tentativas_concluidas: 0,
    pagina: 1, total_paginas: 0, sessoes: [], estatisticas: [],
  }));
  const { rerender } = render(<AdministracaoEstudo token="token-teste" />);
  await screen.findByText('Nenhuma tentativa confirmada no Estudo A.');
  expect(requisicao).toHaveBeenCalledWith('/administracao/estudo-a?pagina=1&tamanho=10&versao=ESTUDO_A_V2', { token: 'token-teste' });
  rerender(<AdministracaoEstudo key="v1" token="token-teste" versao="ESTUDO_A_V1" />);
  await waitFor(() => expect(requisicao).toHaveBeenCalledWith('/administracao/estudo-a?pagina=1&tamanho=10&versao=ESTUDO_A_V1', { token: 'token-teste' }));
  expect(screen.queryByRole('combobox')).toBeNull();
  expect(screen.queryByRole('button', { name: /Exportar/ })).toBeNull();
});

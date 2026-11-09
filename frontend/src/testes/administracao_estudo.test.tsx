import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { AdministracaoEstudo } from '../componentes/AdministracaoEstudo';
import { requisicao } from '../servicos/api';
import { baixarCSV } from '../servicos/administracao';

vi.mock('../servicos/api', () => ({ requisicao: vi.fn() }));
vi.mock('../servicos/administracao', () => ({ baixarCSV: vi.fn().mockResolvedValue(undefined) }));
afterEach(cleanup);

it('consulta e exporta a versão selecionada sem misturar nove e 27 tentativas', async () => {
  vi.mocked(requisicao).mockImplementation(async caminho => ({
    versao_protocolo: caminho.includes('ESTUDO_A_V1') ? 'ESTUDO_A_V1' : 'ESTUDO_A_V2',
    sessoes_total: 0, sessoes_completas: 0, tentativas_concluidas: 0,
    pagina: 1, total_paginas: 0, sessoes: [], estatisticas: [],
  }));
  render(<AdministracaoEstudo token="token-teste" />);
  await screen.findByText('Nenhuma tentativa confirmada no Estudo A.');
  expect(requisicao).toHaveBeenCalledWith('/administracao/estudo-a?pagina=1&tamanho=10&versao=ESTUDO_A_V2', { token: 'token-teste' });
  fireEvent.change(screen.getByLabelText('Versão do Estudo A'), { target: { value: 'ESTUDO_A_V1' } });
  await waitFor(() => expect(requisicao).toHaveBeenCalledWith('/administracao/estudo-a?pagina=1&tamanho=10&versao=ESTUDO_A_V1', { token: 'token-teste' }));
  expect(screen.getByRole('heading', { name: 'Estudo A — ESTUDO_A_V1' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Exportar base selecionada' }));
  await waitFor(() => expect(baixarCSV).toHaveBeenCalledWith('token-teste', 'ESTUDO_A', 'ESTUDO_A_V1'));
});

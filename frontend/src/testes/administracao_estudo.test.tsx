import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

it('recolhe os resultados por condição e tempo até o administrador solicitar a abertura', async () => {
  vi.mocked(requisicao).mockResolvedValue({
    versao_protocolo: 'ESTUDO_A_V2', sessoes_total: 1, sessoes_completas: 1, tentativas_concluidas: 1,
    pagina: 1, total_paginas: 1, sessoes: [],
    estatisticas: [{ condicao: 'LENTO', tempo_alvo_ms: 5000, quantidade: 1, erro_medio_ms: 0,
      erro_absoluto_medio_ms: 0, erro_relativo_medio_percentual: 0, abaixo: 0, acima: 0, igual: 1 }],
  });
  render(<AdministracaoEstudo token="token-teste" />);
  const resumo = await screen.findByText('Resultados por condição e tempo', { selector: 'summary' });
  const painel = resumo.closest('details');
  expect(painel?.open).toBe(false);
  fireEvent.click(resumo);
  expect(painel?.open).toBe(true);
  expect(screen.getByRole('columnheader', { name: 'Erro relativo médio' })).toBeTruthy();
});

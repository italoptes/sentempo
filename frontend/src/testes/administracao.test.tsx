import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { Administracao } from '../paginas/Administracao';
import { requisicao } from '../servicos/api';
import { baixarCSV, obterResumo } from '../servicos/administracao';

vi.mock('../servicos/api', async importar => ({ ...await importar<object>(), requisicao: vi.fn() }));
vi.mock('../servicos/administracao', async importar => ({
  ...await importar<object>(), baixarCSV: vi.fn().mockResolvedValue(undefined), obterResumo: vi.fn(),
  obterEstatisticas: vi.fn(), listarParticipantes: vi.fn(),
}));
afterEach(() => { cleanup(); sessionStorage.clear(); vi.clearAllMocks(); });

it('mostra apenas duas abas e exporta pesquisa e todos os jogos separadamente', async () => {
  sessionStorage.setItem('sentempo_admin_token', 'token-teste');
  vi.mocked(requisicao).mockImplementation(async caminho => caminho.includes('/modo-livre') ? {
    participantes_total: 1, tentativas_total: 1, tempos_total: 1, pagina: 1, total_paginas: 1,
    estatisticas: [], tentativas: [{ id: 'livre', participante_id: 'participante-livre', tempo_alvo_ms: 7000,
      condicao: 'LENTO', resultado_ms: 7200, erro_ms: 200, erro_absoluto_ms: 200, criado_em: '2026-11-09T12:00:00Z' }],
  } : {
    versao_protocolo: caminho.includes('ESTUDO_A_V1') ? 'ESTUDO_A_V1' : 'ESTUDO_A_V2', sessoes_total: 0, sessoes_completas: 0, tentativas_concluidas: 0,
    pagina: 1, total_paginas: 0, sessoes: [], estatisticas: [],
  });
  render(<Administracao />);
  await screen.findByText('Nenhuma tentativa confirmada no Estudo A.');
  expect(obterResumo).not.toHaveBeenCalled();
  expect(screen.queryByRole('heading', { name: 'Resultados do modo livre' })).toBeNull();
  expect(screen.queryByRole('combobox')).toBeNull();
  expect(screen.getAllByRole('tab')).toHaveLength(2);
  expect(screen.getByRole('tab', { name: 'Pesquisa' }).getAttribute('aria-selected')).toBe('true');
  fireEvent.click(screen.getByRole('tab', { name: 'Modo livre' }));
  await screen.findByText('Participante particip');
  expect(screen.queryByRole('heading', { name: 'Sessão de estudo' })).toBeNull();
  expect(screen.queryByRole('heading', { name: /Protocolo anterior/ })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Exportar CSV' }));
  await waitFor(() => expect(baixarCSV).toHaveBeenCalledWith('token-teste', 'LIVRE'));
  expect(screen.getByRole('tab', { name: 'Modo livre' }).getAttribute('aria-selected')).toBe('true');
  expect(screen.queryByText(/histórico/i)).toBeNull();
  fireEvent.keyDown(screen.getByRole('tab', { name: 'Modo livre' }), { key: 'ArrowLeft' });
  await screen.findByText('Nenhuma tentativa confirmada no Estudo A.');
  expect(screen.getByRole('tab', { name: 'Pesquisa' }).getAttribute('aria-selected')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Exportar CSV' }));
  await waitFor(() => expect(baixarCSV).toHaveBeenCalledWith('token-teste', 'ESTUDO_A'));

});

it('permite repetir uma consulta do modo livre após falha', async () => {
  sessionStorage.setItem('sentempo_admin_token', 'token-teste');
  vi.mocked(requisicao).mockResolvedValueOnce({ versao_protocolo: 'ESTUDO_A_V2', sessoes_total: 0, sessoes_completas: 0, tentativas_concluidas: 0, pagina: 1, total_paginas: 0, sessoes: [], estatisticas: [] }).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({
    participantes_total: 0, tentativas_total: 0, tempos_total: 0, pagina: 1, total_paginas: 0, estatisticas: [], tentativas: [],
  });
  render(<Administracao />);
  await screen.findByText('Nenhuma tentativa confirmada no Estudo A.');
  fireEvent.click(screen.getByRole('tab', { name: 'Modo livre' }));
  await screen.findByRole('alert');
  fireEvent.click(screen.getByRole('button', { name: 'Atualizar' }));
  await screen.findByText('Nenhuma tentativa registrada no modo livre.');
  expect(screen.queryByRole('alert')).toBeNull();
});

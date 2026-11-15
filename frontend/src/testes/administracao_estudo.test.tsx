import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { AdministracaoEstudo } from '../componentes/AdministracaoEstudo';
import { requisicao } from '../servicos/api';
import type { ResultadoAnaliseEstudo } from '../tipos/administracao';

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

it('abre nos resultados de sessões concluídas e interpreta a comparação pareada pela medida', async () => {
  const resultados: ResultadoAnaliseEstudo[] = [5000, 10000, 15000].flatMap(tempo =>
    (['SEM_ESTIMULO', 'LENTO', 'RAPIDO'] as const).map(condicao => ({
      condicao,
      tempo_alvo_ms: tempo,
      participantes: 2,
      erro_assinado_medio_ms: condicao === 'RAPIDO' && tempo === 10000 ? -900 : -300,
      erro_absoluto_medio_ms: condicao === 'RAPIDO' && tempo === 10000 ? 1200 : 600,
      erro_relativo_medio_percentual: condicao === 'RAPIDO' && tempo === 10000 ? -9 : -3,
    })),
  );
  vi.mocked(requisicao).mockResolvedValue({
    versao_protocolo: 'ESTUDO_A_V2', sessoes_total: 3, sessoes_completas: 2, tentativas_concluidas: 19,
    pagina: 1, total_paginas: 1, sessoes: [], estatisticas: [],
    analise: {
      criterio_inclusao: 'SESSOES_CONCLUIDAS', participantes: 2, resultados,
      comparacoes: [{
        condicao: 'RAPIDO', referencia: 'SEM_ESTIMULO', tempo_alvo_ms: 10000, pares: 2,
        diferenca_erro_assinado_media_ms: -600, diferenca_erro_absoluto_media_ms: 600,
        diferenca_erro_relativo_media_pp: -6, mais_cedo: 1, mais_tarde: 1, mesmo_tempo: 0,
      }],
    },
  });

  render(<AdministracaoEstudo token="token-teste" />);
  expect(await screen.findByText('Estudo A · V2 · Sessões concluídas · 2 participantes')).toBeTruthy();
  expect(screen.getByTestId('grafico-resultados-estudo')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Erro assinado médio' }).getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByText('0,600 s mais cedo que no silêncio.')).toBeTruthy();
  expect(screen.getByText('Diferença individual de tempo: 1 mais cedo · 1 mais tarde · 0 no mesmo tempo.')).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'Erro absoluto médio' }));
  expect(screen.getByText('0,600 s mais longe do alvo que no silêncio.')).toBeTruthy();
  expect(screen.getAllByText(/n = 2/)).toHaveLength(9);
});

it('diferencia ausência de observações de um resultado igual a zero', async () => {
  const resultados: ResultadoAnaliseEstudo[] = [5000, 10000, 15000].flatMap(tempo =>
    (['SEM_ESTIMULO', 'LENTO', 'RAPIDO'] as const).map(condicao => ({
      condicao, tempo_alvo_ms: tempo, participantes: 0,
      erro_assinado_medio_ms: null, erro_absoluto_medio_ms: null, erro_relativo_medio_percentual: null,
    })),
  );
  resultados[0] = { ...resultados[0], participantes: 1, erro_assinado_medio_ms: 0, erro_absoluto_medio_ms: 0, erro_relativo_medio_percentual: 0 };
  vi.mocked(requisicao).mockResolvedValue({
    versao_protocolo: 'ESTUDO_A_V2', sessoes_total: 0, sessoes_completas: 0, tentativas_concluidas: 0,
    pagina: 1, total_paginas: 0, sessoes: [], estatisticas: [],
    analise: { criterio_inclusao: 'SESSOES_CONCLUIDAS', participantes: 0, resultados, comparacoes: [] },
  });

  render(<AdministracaoEstudo token="token-teste" />);
  await screen.findByText(/Ainda não há sessões concluídas/);
  expect(screen.getByText('0,000 s')).toBeTruthy();
  expect(screen.getAllByText('Sem observações').length).toBeGreaterThan(0);
  expect(screen.getByText('Sem pares para esta comparação.')).toBeTruthy();
});

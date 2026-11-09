import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { ResultadosEstudo } from '../componentes/ResultadosEstudo';
import { sessaoResultados } from './dados_resultados';

afterEach(cleanup);

it('resume os nove resultados e apresenta apenas a condição selecionada, ordenada por alvo', () => {
  render(<ResultadosEstudo sessao={sessaoResultados} />);
  expect(screen.getByRole('heading', { name: 'As 9 tentativas foram concluídas' })).toBeTruthy();
  expect(screen.getByText('0,72 s')).toBeTruthy();
  expect(screen.getByText(/1 parada exata/)).toBeTruthy();
  const painel = screen.getByRole('tabpanel', { name: /Silêncio/ });
  expect(within(painel).getByText('Bloco 2 · 3 tentativas')).toBeTruthy();
  expect(within(painel).getAllByRole('article').map(a => a.getAttribute('aria-label'))).toEqual([
    'Alvo de 5 segundos', 'Alvo de 10 segundos', 'Alvo de 15 segundos',
  ]);
  expect(within(painel).getByText('4,80 s')).toBeTruthy();
  expect(within(painel).getByText('No alvo')).toBeTruthy();
  expect(screen.queryByText('repetição 1')).toBeNull();
  fireEvent.click(screen.getByRole('tab', { name: /Bipes rápidos/ }));
  expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
  expect(screen.getByRole('tab', { name: /Bipes rápidos/ }).getAttribute('aria-selected')).toBe('true');
  expect(within(screen.getByRole('tabpanel')).getByText('4,00 s')).toBeTruthy();
});

it('permite navegar pelas condições usando setas, Home e End', () => {
  render(<ResultadosEstudo sessao={sessaoResultados} />);
  const silencio = screen.getByRole('tab', { name: /Silêncio/ });
  fireEvent.keyDown(silencio, { key: 'ArrowRight' });
  const lento = screen.getByRole('tab', { name: /Bipes lentos/ });
  expect(document.activeElement).toBe(lento);
  expect(lento.getAttribute('aria-selected')).toBe('true');
  fireEvent.keyDown(lento, { key: 'End' });
  const rapido = screen.getByRole('tab', { name: /Bipes rápidos/ });
  expect(document.activeElement).toBe(rapido);
  fireEvent.keyDown(rapido, { key: 'ArrowRight' });
  expect(document.activeElement).toBe(silencio);
  fireEvent.keyDown(silencio, { key: 'End' });
  fireEvent.keyDown(rapido, { key: 'Home' });
  expect(document.activeElement).toBe(silencio);
});

it('mantém as métricas do backend disponíveis nos detalhes sem trocar sinais', () => {
  render(<ResultadosEstudo sessao={sessaoResultados} />);
  const cartao = screen.getByRole('article', { name: 'Alvo de 5 segundos' });
  expect(within(cartao).getByText('0,200 s antes do alvo')).toBeTruthy();
  const detalhes = within(cartao).getByText('Ver detalhes').closest('details')!;
  expect(detalhes.open).toBe(false);
  fireEvent.click(within(cartao).getByText('Ver detalhes'));
  expect(detalhes.open).toBe(true);
  expect(within(cartao).getByText('−0,200 s')).toBeTruthy();
  expect(within(cartao).getByText('-4%')).toBeTruthy();
});

it('não expõe resultados antes do encerramento nem converte valores ausentes em zero', () => {
  const { rerender, container } = render(<ResultadosEstudo sessao={{ ...sessaoResultados, situacao: 'QUESTIONARIO_FINAL' }} />);
  expect(container.textContent).toBe('');
  rerender(<ResultadosEstudo sessao={{ ...sessaoResultados, tentativas: sessaoResultados.tentativas.map(t => ({ ...t, resultado_ms: null })) }} />);
  expect(screen.getByText('Nenhum resultado disponível para esta condição.')).toBeTruthy();
  expect(screen.queryByText('0,00 s')).toBeNull();
});

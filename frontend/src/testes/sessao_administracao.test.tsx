import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { SessaoAdministracao } from '../componentes/SessaoAdministracao';
import { sessaoResultados } from './dados_resultados';

afterEach(cleanup);

it('agrupa as tentativas e respostas por bloco e mantém os identificadores disponíveis', () => {
  render(<SessaoAdministracao sessao={{ ...sessaoResultados, codigo_participante: 'participante-completo',
    estrategia: 'CONTAGEM_MENTAL', comentario: 'Usei uma contagem constante.',
    respostas_blocos: [{ bloco: 1, agradabilidade: 4, ansiedade: 2 }],
    tentativas: sessaoResultados.tentativas.map(t => ({ ...t, questionario_respondido: true, confianca: 6 })),
  }} />);
  fireEvent.click(screen.getByText('Participante particip'));
  const primeiroBloco = within(screen.getByRole('region', { name: 'Bloco 1' }));
  expect(primeiroBloco.getByRole('table').querySelectorAll('tbody tr')).toHaveLength(3);
  expect(primeiroBloco.getByRole('columnheader', { name: 'Erro absoluto' })).toBeTruthy();
  expect(primeiroBloco.getByText('4/7')).toBeTruthy();
  expect(primeiroBloco.getByText('2/7')).toBeTruthy();
  expect(screen.getByText('Contou mentalmente')).toBeTruthy();
  expect(screen.getByText('Usei uma contagem constante.')).toBeTruthy();
  expect(within(screen.getByRole('region', { name: 'Configuração da sessão' })).getByText('50%')).toBeTruthy();
  const identificacao = screen.getByText('Identificação da sessão').closest('details');
  expect(identificacao?.open).toBe(false);
  fireEvent.click(screen.getByText('Identificação da sessão'));
  expect(identificacao?.open).toBe(true);
  expect(screen.getByText('participante-completo')).toBeTruthy();
});

it('distingue resultado pendente, resposta omitida e valor zero', () => {
  render(<SessaoAdministracao sessao={{ ...sessaoResultados, codigo_participante: 'participante-completo',
    concluida_em: null, situacao: 'EM_ANDAMENTO',
    respostas_blocos: [{ bloco: 1, agradabilidade: null, ansiedade: 7 }],
    tentativas: [
      { ...sessaoResultados.tentativas[0], resultado_ms: 0, erro_ms: 0, erro_absoluto_ms: 0, erro_relativo_percentual: 0, questionario_respondido: true, confianca: null },
      { ...sessaoResultados.tentativas[1], concluida: false, resultado_ms: null, erro_ms: null, erro_absoluto_ms: null, erro_relativo_percentual: null, questionario_respondido: false },
    ],
  }} />);
  fireEvent.click(screen.getByText('Participante particip'));
  const bloco = within(screen.getByRole('region', { name: 'Bloco 1' }));
  expect(bloco.getByText('+0,000 s')).toBeTruthy();
  expect(bloco.getByText('0,000%')).toBeTruthy();
  expect(bloco.getAllByText('—')).toHaveLength(4);
  expect(bloco.getAllByText('Não respondeu')).toHaveLength(2);
  expect(bloco.getAllByText('Pendente')).toHaveLength(2);
  expect(within(screen.getByRole('region', { name: 'Questionário final' })).getAllByText('Pendente')).toHaveLength(2);
});

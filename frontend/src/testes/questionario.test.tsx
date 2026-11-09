import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { QuestionarioEstudo } from '../componentes/QuestionarioEstudo';

afterEach(cleanup);

it('permite pular confiança sem transformar ausência em zero', () => {
  const confirmar = vi.fn().mockResolvedValue(undefined);
  render(<QuestionarioEstudo pergunta={{ tipo: 'TENTATIVA', tentativa_id: 't1' }} ocupado={false} aoConfirmar={confirmar} />);
  const continuar = screen.getByRole('button', { name: 'Continuar' }) as HTMLButtonElement;
  expect(continuar.disabled).toBe(true);
  fireEvent.click(screen.getByLabelText('Prefiro não responder'));
  fireEvent.click(continuar);
  expect(confirmar).toHaveBeenCalledWith({ tipo: 'TENTATIVA', tentativa_id: 't1', confianca: null });
  expect(screen.queryByText(/resultado:/i)).toBeNull();
});

it('mantém perguntas do bloco independentes e preserva escala inteira', () => {
  const confirmar = vi.fn().mockResolvedValue(undefined);
  render(<QuestionarioEstudo pergunta={{ tipo: 'BLOCO', bloco: 1 }} ocupado={false} aoConfirmar={confirmar} />);
  const grupos = screen.getAllByRole('group');
  const agradabilidade = grupos.find(g => g.textContent?.includes('Quão agradável'))!;
  const ansiedade = grupos.find(g => g.textContent?.startsWith('Quanta ansiedade'))!;
  fireEvent.click(agradabilidade.querySelector('input[value="6"]')!);
  fireEvent.click(ansiedade.querySelector('input[value="pular"]')!);
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  expect(confirmar).toHaveBeenCalledWith({ tipo: 'BLOCO', bloco: 1, agradabilidade: 6, ansiedade: null });
});

it('coleta estratégia final e comentário limitado', () => {
  const confirmar = vi.fn().mockResolvedValue(undefined);
  render(<QuestionarioEstudo pergunta={{ tipo: 'FINAL' }} ocupado={false} aoConfirmar={confirmar} />);
  fireEvent.click(screen.getByLabelText('Contei mentalmente'));
  const comentario = screen.getByRole('textbox') as HTMLTextAreaElement;
  expect(comentario.maxLength).toBe(300);
  fireEvent.change(comentario, { target: { value: ' contei em voz baixa ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  expect(confirmar).toHaveBeenCalledWith({ tipo: 'FINAL', estrategia: 'CONTAGEM_MENTAL', comentario: 'contei em voz baixa' });
});

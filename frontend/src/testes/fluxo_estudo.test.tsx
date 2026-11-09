import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { EstudoA } from '../paginas/EstudoA';
import { consultarEstudo, continuarEstudo, responderQuestionario, salvarResultadoEstudo } from '../servicos/estudo';
import { prepararAudioEstudo } from '../utilitarios/audio_estudo';
import type { PosicaoEstudo, SessaoEstudo } from '../servicos/estudo';

vi.mock('../utilitarios/audio_estudo', () => ({ prepararAudioEstudo: vi.fn() }));
vi.mock('../servicos/estudo', async importar => {
  const original = await importar<typeof import('../servicos/estudo')>();
  return { ...original, consultarEstudo: vi.fn(), criarEstudo: vi.fn(), continuarEstudo: vi.fn(), responderQuestionario: vi.fn(), salvarResultadoEstudo: vi.fn() };
});
const posicao: PosicaoEstudo = { id: 't1', ordem: 1, bloco: 1, repeticao: 1, condicao: 'SEM_ESTIMULO', tempo_alvo_ms: 10000,
  concluida: false, resultado_ms: null, erro_ms: null, erro_absoluto_ms: null, erro_relativo_percentual: null };
const sessao: SessaoEstudo = { id: 's1', versao_protocolo: 'ESTUDO_A_V2', sequencia: 0, ordem_condicoes: ['SEM_ESTIMULO', 'LENTO', 'RAPIDO'], dispositivo: 'COMPUTADOR', usa_fones: false,
  volume: 0.5, consentido_em: '2026-11-04T10:00:00Z', concluida_em: null, bloco_liberado: 1, concluidas: 0, total: 9,
  situacao: 'EM_ANDAMENTO', proxima: posicao, blocos: [], tentativas: [posicao], questionario_pendente: null, respostas_blocos: [], estrategia: null, comentario: null };
beforeEach(() => {
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  vi.mocked(prepararAudioEstudo).mockResolvedValue({ iniciar: vi.fn(), parar: vi.fn() });
});
afterEach(cleanup);
function montar() { return render(<MemoryRouter><EstudoA participanteId="p1" /></MemoryRouter>); }

it('informa alvo antes de iniciar e o oculta durante a medição e questionário', async () => {
  vi.mocked(consultarEstudo).mockResolvedValue(sessao);
  vi.mocked(salvarResultadoEstudo).mockResolvedValue({ ...sessao, situacao: 'QUESTIONARIO_TENTATIVA', concluidas: 1,
    questionario_pendente: { tipo: 'TENTATIVA', tentativa_id: 't1', ordem: 1 } });
  vi.mocked(responderQuestionario).mockResolvedValue({ ...sessao, proxima: { ...posicao, id: 't2', ordem: 2 }, concluidas: 1 });
  montar();
  expect(await screen.findByRole('heading', { name: 'Estime 10 segundos' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar tentativa' }));
  expect(await screen.findByText('Prepare-se. A tentativa vai começar.')).toBeTruthy();
  expect(screen.getByRole('progressbar', { name: 'Iniciando...' })).toBeTruthy();
  const finalizar = await screen.findByRole('button', { name: 'Finalizar' }, { timeout: 4000 });
  expect(screen.queryByText(/Estime 10 segundos/)).toBeNull();
  expect(screen.queryByText(/de 9/)).toBeNull();
  expect(screen.queryByRole('progressbar')).toBeNull();
  fireEvent.click(finalizar);
  expect(await screen.findByText('Quão confiante você está de que finalizou próximo do tempo-alvo?')).toBeTruthy();
  expect(screen.queryByText(/Resultado:/)).toBeNull();
  fireEvent.click(screen.getByLabelText('Prefiro não responder'));
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  await waitFor(() => expect(responderQuestionario).toHaveBeenCalledWith('p1', { tipo: 'TENTATIVA', tentativa_id: 't1', confianca: null }));
  expect(await screen.findByText('Bloco 1 de 3 · tentativa 2 de 3')).toBeTruthy();
});

it('pausa depende de continuar e não cria próximo bloco após encerramento', async () => {
  const intervalo = { ...sessao, situacao: 'INTERVALO' as const, concluidas: 3, proxima: { ...posicao, ordem: 4, bloco: 2 } };
  vi.mocked(consultarEstudo).mockResolvedValue(intervalo);
  vi.mocked(continuarEstudo).mockResolvedValue({ ...intervalo, situacao: 'EM_ANDAMENTO', bloco_liberado: 2 });
  const vista = montar();
  expect(await screen.findByRole('heading', { name: 'Bloco 1 concluído' })).toBeTruthy();
  expect(continuarEstudo).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: 'Iniciar tentativa' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  expect(await screen.findByRole('button', { name: 'Iniciar tentativa' })).toBeTruthy();
  expect(continuarEstudo).toHaveBeenCalledTimes(1);
  vista.unmount();
  vi.mocked(consultarEstudo).mockResolvedValue({ ...sessao, situacao: 'CONCLUIDA', proxima: null, concluidas: 9, concluida_em: '2026-11-04T10:15:00Z' });
  montar();
  expect(await screen.findByRole('heading', { name: 'As 9 tentativas foram concluídas' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Continuar' })).toBeNull();
});

it('mantém o teste de áudio disponível após falha, sem liberar participação', async () => {
  vi.mocked(consultarEstudo).mockResolvedValue(null);
  vi.mocked(prepararAudioEstudo).mockRejectedValue(new Error('Áudio bloqueado'));
  montar();
  const testar = await screen.findByRole('button', { name: 'Testar áudio' });
  expect(screen.getByText(/três blocos de três tentativas, totalizando 9 tentativas/)).toBeTruthy();
  fireEvent.click(testar);
  await screen.findByText('Não foi possível reproduzir o áudio. Verifique as permissões e teste novamente.');
  expect(screen.getByRole('button', { name: 'Testar áudio' })).toBeTruthy();
  expect((screen.getByRole('button', { name: 'Iniciar participação' }) as HTMLButtonElement).disabled).toBe(true);
});

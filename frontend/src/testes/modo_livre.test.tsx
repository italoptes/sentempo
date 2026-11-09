import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { Inicio } from '../paginas/Inicio';
import { ModoLivre } from '../paginas/ModoLivre';
import { AcessoModoLivre } from '../componentes/AcessoModoLivre';
import { criarTempoPersonalizado, obterStatusModoLivre } from '../servicos/modo_livre';
import type { ParticipanteDetalhe } from '../tipos/participante';

vi.mock('../servicos/modo_livre', () => ({ obterStatusModoLivre: vi.fn(), criarTempoPersonalizado: vi.fn(), excluirTempoPersonalizado: vi.fn() }));
const participante: ParticipanteDetalhe = { id: 'p1', nome: 'Ana', codigo: '0042', novo_participante: false,
  progresso: { concluidas: 9, total: 9 }, combinacoes: [], tentativas: [], tentativas_livres: [] };
const recarregar = vi.fn().mockResolvedValue(undefined);
afterEach(() => { cleanup(); vi.clearAllMocks(); });

function montarAcesso(rota = '/modo-livre') {
  return render(<MemoryRouter initialEntries={[rota]}><Routes>
    <Route element={<AcessoModoLivre participanteId="p1" />}>
      <Route path="/modo-livre" element={<p>Configurar desafios</p>} />
      <Route path="/experimento-livre/:id/:tempo/:condicao" element={<p>Partida iniciada</p>} />
    </Route>
    <Route path="/estudo-a" element={<p>Pesquisa aberta</p>} />
  </Routes></MemoryRouter>);
}

it('explicita bloqueio mesmo com protocolo antigo completo e retira os controles de jogo do início', () => {
  render(<MemoryRouter><Inicio participante={participante} modoLivre={{ desbloqueado: false, tempos: [] }} tutorialAberto={false} onFecharTutorial={vi.fn()} onSair={vi.fn()} onRecarregar={recarregar} /></MemoryRouter>);
  expect((screen.getByRole('button', { name: 'Jogar modo livre — bloqueado' }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByText('Bloqueado · conclua a pesquisa para jogar')).toBeTruthy();
  expect(screen.queryByRole('link', { name: 'Fazer pesquisa para desbloquear' })).toBeNull();
  expect(screen.getByRole('link', { name: 'Participar ou retomar estudo' }).getAttribute('href')).toBe('/estudo-a');
  expect(screen.queryByLabelText('Tempo personalizado em segundos')).toBeNull();
});

it('oferece acesso ao jogo separado quando a pesquisa está concluída', () => {
  render(<MemoryRouter><Inicio participante={participante} modoLivre={{ desbloqueado: true, tempos: [] }} tutorialAberto={false} onFecharTutorial={vi.fn()} onSair={vi.fn()} onRecarregar={recarregar} /></MemoryRouter>);
  expect(screen.getByRole('link', { name: 'Jogar modo livre' }).getAttribute('href')).toBe('/modo-livre');
  expect(screen.queryByRole('button', { name: /bloqueado/ })).toBeNull();
});

it.each(['/modo-livre', '/experimento-livre/antigo/7000/LENTO'])('bloqueia link direto %s e conduz à pesquisa', async rota => {
  vi.mocked(obterStatusModoLivre).mockResolvedValue({ desbloqueado: false, tempos: [] });
  montarAcesso(rota);
  expect(await screen.findByRole('heading', { name: 'Bloqueado · conclua a pesquisa para jogar' })).toBeTruthy();
  expect(screen.queryByText('Partida iniciada')).toBeNull();
  expect(screen.queryByText('Configurar desafios')).toBeNull();
  fireEvent.click(screen.getByRole('link', { name: 'Concluir pesquisa e desbloquear' }));
  expect(await screen.findByText('Pesquisa aberta')).toBeTruthy();
});

it('não libera o jogo enquanto a consulta está pendente', async () => {
  let confirmar!: (resposta: { desbloqueado: boolean; tempos: [] }) => void;
  vi.mocked(obterStatusModoLivre).mockReturnValue(new Promise(resolve => { confirmar = resolve; }));
  montarAcesso();
  expect(screen.queryByText('Configurar desafios')).toBeNull();
  confirmar({ desbloqueado: true, tempos: [] });
  expect(await screen.findByText('Configurar desafios')).toBeTruthy();
});

it('falha de consulta não libera partidas e permite tentar novamente', async () => {
  vi.mocked(obterStatusModoLivre).mockRejectedValueOnce(new Error('Offline')).mockResolvedValue({ desbloqueado: true, tempos: [] });
  montarAcesso('/experimento-livre/tempo1/7000/LENTO');
  fireEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }));
  expect(await screen.findByText('Partida iniciada')).toBeTruthy();
});

it('cria um desafio na tela de jogo e abre a partida escolhida', async () => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  const tempo = { id: 'tempo1', tempo_alvo_ms: 7000, ativo: true, criado_em: '2026-11-09T10:00:00Z' };
  vi.mocked(obterStatusModoLivre).mockResolvedValueOnce({ desbloqueado: true, tempos: [] }).mockResolvedValue({ desbloqueado: true, tempos: [tempo] });
  vi.mocked(criarTempoPersonalizado).mockResolvedValue(tempo);
  render(<MemoryRouter initialEntries={['/modo-livre']}><Routes>
    <Route element={<AcessoModoLivre participanteId="p1" />}>
      <Route path="/modo-livre" element={<ModoLivre participante={participante} onRecarregar={recarregar} />} />
      <Route path="/experimento-livre/:id/:tempo/:condicao" element={<p>Partida iniciada</p>} />
    </Route>
  </Routes></MemoryRouter>);
  fireEvent.change(await screen.findByLabelText('Tempo personalizado em segundos'), { target: { value: '7' } });
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
  await waitFor(() => expect(criarTempoPersonalizado).toHaveBeenCalledWith('p1', 7000));
  fireEvent.click(await screen.findByRole('button', { name: 'Jogar' }));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Estímulo Lento' }));
  expect(await screen.findByText('Partida iniciada')).toBeTruthy();
});

it.each([5000, 10000, 15000])('abre desafio clássico de %i ms mesmo com protocolo antigo completo', async ms => {
  const tempo = { id: `classico-${ms}`, tempo_alvo_ms: ms, ativo: true, criado_em: '2026-11-09T10:00:00Z' };
  vi.mocked(obterStatusModoLivre).mockResolvedValue({ desbloqueado: true, tempos: [tempo] });
  render(<MemoryRouter initialEntries={['/modo-livre']}><Routes>
    <Route element={<AcessoModoLivre participanteId="p1" />}>
      <Route path="/modo-livre" element={<ModoLivre participante={participante} onRecarregar={recarregar} />} />
      <Route path="/experimento-livre/:id/:tempo/:condicao" element={<p>Partida livre iniciada</p>} />
    </Route>
  </Routes></MemoryRouter>);
  fireEvent.click(await screen.findByRole('button', { name: `${ms / 1000} segundos` }));
  fireEvent.click(screen.getByRole('button', { name: /Estímulo Lento/ }));
  expect(await screen.findByText('Partida livre iniciada')).toBeTruthy();
  expect(criarTempoPersonalizado).not.toHaveBeenCalled();
});

it('prepara automaticamente um tempo clássico sem exigir cadastro manual', async () => {
  const tempo = { id: 'classico10', tempo_alvo_ms: 10000, ativo: true, criado_em: '2026-11-09T10:00:00Z' };
  vi.mocked(obterStatusModoLivre).mockResolvedValue({ desbloqueado: true, tempos: [] });
  vi.mocked(criarTempoPersonalizado).mockResolvedValue(tempo);
  render(<MemoryRouter initialEntries={['/modo-livre']}><Routes>
    <Route element={<AcessoModoLivre participanteId="p1" />}>
      <Route path="/modo-livre" element={<ModoLivre participante={participante} onRecarregar={recarregar} />} />
      <Route path="/experimento-livre/:id/:tempo/:condicao" element={<p>Partida livre iniciada</p>} />
    </Route>
  </Routes></MemoryRouter>);
  fireEvent.click(await screen.findByRole('button', { name: '10 segundos' }));
  fireEvent.click(screen.getByRole('button', { name: /Estímulo Rápido/ }));
  expect(await screen.findByText('Partida livre iniciada')).toBeTruthy();
  expect(criarTempoPersonalizado).toHaveBeenCalledWith('p1', 10000);
});

it.each([false, true])('integra o histórico aos resultados do jogo (com partidas livres: %s)', async comPartidasLivres => {
  const anterior = { id: 'antiga', tempo_alvo_ms: 30000, condicao: 'LENTO', resultado_ms: 31000, erro_ms: 1000, erro_absoluto_ms: 1000, criado_em: '2026-11-01T10:00:00Z' };
  const livre = { ...anterior, id: 'livre', tempo_alvo_ms: 7000, resultado_ms: 8000 };
  const perfil = { ...participante, tentativas: [anterior], tentativas_livres: comPartidasLivres ? [livre] : [] };
  const inicio = render(<MemoryRouter><Inicio participante={perfil} modoLivre={{ desbloqueado: true, tempos: [] }} tutorialAberto={false} onFecharTutorial={vi.fn()} onSair={vi.fn()} onRecarregar={recarregar} /></MemoryRouter>);
  expect(screen.queryByText('Resultados do protocolo anterior')).toBeNull();
  expect(screen.queryByText('Alvo de 30 segundos')).toBeNull();
  inicio.unmount();
  vi.mocked(obterStatusModoLivre).mockResolvedValue({ desbloqueado: true, tempos: [] });
  render(<MemoryRouter initialEntries={['/modo-livre']}><Routes>
    <Route element={<AcessoModoLivre participanteId="p1" />}>
      <Route path="/modo-livre" element={<ModoLivre participante={perfil} onRecarregar={recarregar} />} />
    </Route>
  </Routes></MemoryRouter>);
  const resultados = await screen.findByRole('region', { name: 'Seus resultados' });
  expect(within(resultados).getAllByText('Alvo de 30 segundos').length).toBeGreaterThan(0);
  if (comPartidasLivres) expect(within(resultados).getAllByText('8,00 s').length).toBeGreaterThan(0);
  expect(screen.getByText(/Este modo é fora do estudo, apenas para brincar/)).toBeTruthy();
  expect(within(resultados).queryByRole('button')).toBeNull();
});

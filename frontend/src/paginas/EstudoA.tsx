import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { consultarEstudo, continuarEstudo, criarEstudo, rotularCondicaoEstudo } from '../servicos/estudo';
import type { ContextoEstudo, SessaoEstudo } from '../servicos/estudo';
import { prepararAudioEstudo } from '../utilitarios/audio_estudo';
import type { AudioEstudo } from '../utilitarios/audio_estudo';
import { usarRodadaEstudo } from '../ganchos/usarRodadaEstudo';
import { IndicadorCarregamento } from '../componentes/IndicadorCarregamento';
import { formatarErro, formatarSegundos } from '../utilitarios/formatacao';

const botao = 'min-h-12 rounded-xl bg-destaque text-principal font-semibold px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed';

export function EstudoA({ participanteId }: { participanteId: string }) {
  const [sessao, definirSessao] = useState<SessaoEstudo | null>(null);
  const [carregando, definirCarregando] = useState(true);
  const [erro, definirErro] = useState<string | null>(null);
  const [consentimento, definirConsentimento] = useState(false);
  const [dispositivo, definirDispositivo] = useState<ContextoEstudo['dispositivo']>('COMPUTADOR');
  const [fones, definirFones] = useState('');
  const [volume, definirVolume] = useState(0.5);
  const [audioOuvido, definirAudioOuvido] = useState(false);
  const [testando, definirTestando] = useState(false);
  const [reproduziu, definirReproduziu] = useState(false);
  const testeRef = useRef<AudioEstudo | null>(null);
  const versaoTeste = useRef(0);
  const timerTeste = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ocupado, definirOcupado] = useState(false);
  const atualizar = useCallback((s: SessaoEstudo) => { definirSessao(s); definirErro(null); }, []);
  const rodada = usarRodadaEstudo(participanteId, atualizar);
  const tituloRef = useRef<HTMLHeadingElement>(null);

  const carregar = useCallback(async () => {
    definirCarregando(true);
    definirErro(null);
    try { definirSessao(await consultarEstudo(participanteId)); }
    catch { definirErro('Não foi possível consultar a sessão. Verifique sua conexão.'); }
    finally { definirCarregando(false); }
  }, [participanteId]);
  useEffect(() => { void carregar(); }, [carregar]);
  useEffect(() => { tituloRef.current?.focus(); }, [rodada.estado, sessao?.proxima?.id, sessao?.situacao]);

  const pararTeste = useCallback(() => {
    versaoTeste.current++;
    testeRef.current?.parar();
    testeRef.current = null;
    if (timerTeste.current !== null) clearTimeout(timerTeste.current);
    timerTeste.current = null;
  }, []);
  useEffect(() => {
    const ocultar = () => { if (document.hidden) { pararTeste(); definirTestando(false); definirReproduziu(false); definirAudioOuvido(false); } };
    document.addEventListener('visibilitychange', ocultar);
    return () => { pararTeste(); document.removeEventListener('visibilitychange', ocultar); };
  }, [pararTeste]);

  async function testarAudio() {
    pararTeste();
    const versao = versaoTeste.current;
    definirTestando(true);
    definirErro(null);
    definirReproduziu(false);
    definirAudioOuvido(false);
    try {
      const audio = await prepararAudioEstudo('LENTO', volume, () => {
        pararTeste(); definirTestando(false); definirErro('O áudio foi interrompido. Teste novamente.');
      });
      if (versao !== versaoTeste.current) { audio.parar(); return; }
      testeRef.current = audio;
      audio.iniciar();
      if (versao !== versaoTeste.current) return;
      timerTeste.current = setTimeout(() => {
        pararTeste(); definirTestando(false); definirReproduziu(true);
      }, 2200);
    } catch {
      if (versao !== versaoTeste.current) return;
      definirTestando(false);
      definirErro('Não foi possível reproduzir o áudio. Verifique as permissões e teste novamente.');
    }
  }

  async function participar() {
    if (ocupado || !consentimento || !audioOuvido || !fones || testando) return;
    definirOcupado(true);
    try { atualizar(await criarEstudo(participanteId, { consentimento: true, audio_testado: true, dispositivo, usa_fones: fones === 'sim', volume })); }
    catch { definirErro('Não foi possível confirmar a sessão. Consulte novamente antes de continuar.'); }
    finally { definirOcupado(false); }
  }
  async function continuar() {
    if (ocupado) return;
    definirOcupado(true);
    try { atualizar(await continuarEstudo(participanteId)); }
    catch { await carregar(); }
    finally { definirOcupado(false); }
  }

  const ativa = rodada.estado === 'ativa';
  const protegida = ['ativa', 'preparando', 'salvando', 'confirmacao'].includes(rodada.estado);
  return (
    <div className={`min-h-screen ${ativa ? 'bg-principal text-branco' : 'bg-fundo text-principal'}`}>
      <main id="conteudo-principal" tabIndex={-1} className="max-w-2xl mx-auto px-5 py-10 space-y-6">
        {!protegida && <Link to="/inicio" className="inline-flex min-h-11 items-center underline">Voltar ao início</Link>}
        <h1 ref={tituloRef} tabIndex={-1} className="text-2xl font-semibold">
          {ativa ? 'Em andamento' : rodada.estado === 'interrompida' ? 'Tentativa interrompida' : 'Estudo de percepção temporal'}
        </h1>
        {erro && <p role="alert" className="rounded-xl border border-red-700 p-4">{erro} <button className="underline min-h-11" onClick={() => void carregar()}>Consultar sessão</button></p>}
        {carregando ? <IndicadorCarregamento mensagem="Consultando sessão..." /> : erro && !sessao ? null : !sessao ? (
          <section className="bg-branco rounded-2xl p-6 space-y-5 border border-destaque-claro">
            <p>Você vai estimar intervalos de 5, 10 e 15 segundos em três blocos, totalizando 27 tentativas. Algumas terão bipes e outras serão silenciosas.</p>
            <p>Antes de cada tentativa, informaremos o tempo-alvo. Toque em Finalizar quando acreditar que esse intervalo terminou. Estime sem contar segundos nem usar os bipes como contagem.</p>
            <p>A participação é voluntária. Você pode interromper ou sair a qualquer momento. Guardaremos suas respostas com um identificador, a categoria de dispositivo e o uso declarado de fones para análise acadêmica. Há pausas livres entre blocos.</p>
            <label className="flex gap-3 items-start min-h-12"><input type="checkbox" checked={consentimento} onChange={e => definirConsentimento(e.target.checked)} className="mt-1 h-5 w-5" />Li a explicação e concordo em participar.</label>
            <label className="block">Dispositivo usado
              <select value={dispositivo} onChange={e => definirDispositivo(e.target.value as ContextoEstudo['dispositivo'])} className="block w-full border border-borda-controle rounded-lg p-3 mt-2">
                <option value="COMPUTADOR">Computador</option><option value="CELULAR">Celular</option><option value="TABLET">Tablet</option><option value="OUTRO">Outro</option>
              </select>
            </label>
            <label className="block">Está usando fones de ouvido?
              <select value={fones} onChange={e => definirFones(e.target.value)} className="block w-full border border-borda-controle rounded-lg p-3 mt-2"><option value="">Selecione</option><option value="sim">Sim</option><option value="nao">Não</option></select>
            </label>
            <p>Fones são recomendados. Ajuste também o volume do dispositivo para um nível confortável e mantenha-o durante a sessão.</p>
            <label className="block">Volume do teste e das tentativas
              <input aria-label="Volume do teste e das tentativas" type="range" min="0.1" max="1" step="0.05" value={volume} disabled={testando} onChange={e => { definirVolume(Number(e.target.value)); definirAudioOuvido(false); definirReproduziu(false); }} className="block w-full min-h-11" />
            </label>
            <button className={botao} disabled={testando} onClick={() => void testarAudio()}>{testando ? 'Reproduzindo teste...' : 'Testar áudio'}</button>
            {reproduziu && <label className="flex gap-3 min-h-12 items-center"><input type="checkbox" checked={audioOuvido} onChange={e => definirAudioOuvido(e.target.checked)} className="h-5 w-5" />Ouvi os bipes em volume confortável.</label>}
            <button className={`${botao} block w-full`} disabled={!consentimento || !fones || !audioOuvido || testando || ocupado} onClick={() => void participar()}>Iniciar participação</button>
          </section>
        ) : rodada.estado === 'preparando' || rodada.estado === 'salvando' ? (
          <p role="status">{rodada.estado === 'preparando' ? 'Preparando áudio...' : 'Confirmando salvamento...'}</p>
        ) : rodada.estado === 'confirmacao' ? (
          <section className="space-y-4"><p role="alert">{rodada.erro}</p><button className={botao} disabled={rodada.consultando} onClick={() => void rodada.verificarConfirmacao()}>Consultar confirmação</button></section>
        ) : rodada.estado === 'interrompida' ? (
          <section className="space-y-5"><p role="status">A tentativa foi interrompida. Vamos tentar novamente?</p>{rodada.erro && <p>{rodada.erro}</p>}<p>As tentativas concluídas foram preservadas.</p>
            <button className={botao} onClick={() => { if (sessao.proxima) void rodada.iniciar(sessao.proxima, sessao.volume); }}>Recomeçar</button>
          </section>
        ) : ativa ? (
          <div className="min-h-[60vh] flex items-center justify-center"><button type="button" className="w-full max-w-sm min-h-24 rounded-2xl bg-destaque text-principal text-2xl font-semibold" onClick={() => void rodada.finalizar()}>Finalizar</button></div>
        ) : sessao.situacao === 'CONCLUIDA' ? (
          <section className="space-y-5"><h2 className="text-xl font-semibold">As 27 tentativas foram concluídas</h2><p>Obrigado por participar. O estudo compara estimativas de duração em silêncio e com dois ritmos de bipes. Diferenças nas respostas não medem diretamente atenção ou concentração e não comprovam, por si, um efeito de nudge.</p>
            <details><summary className="min-h-11 cursor-pointer underline">Ver meus resultados</summary>
              <p className="my-4">Parada antecipada (erro negativo) é compatível com superestimação da duração transcorrida. Parada tardia (erro positivo), com subestimação.</p>
              <ol className="space-y-3">{sessao.tentativas.map(t => <li key={t.id} className="rounded-xl border border-borda-controle bg-branco p-4">
                <p>Tentativa {t.ordem} · bloco {t.bloco} · repetição {t.repeticao}</p><p>{rotularCondicaoEstudo(t.condicao)} · alvo {t.tempo_alvo_ms / 1000} s</p>
                <p>Resultado: {formatarSegundos(t.resultado_ms ?? 0)} · erro: {formatarErro(t.erro_ms ?? 0)}</p><p>Erro absoluto: {formatarSegundos(t.erro_absoluto_ms ?? 0)} · erro relativo: {t.erro_relativo_percentual?.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}%</p>
              </li>)}</ol>
            </details>
          </section>
        ) : sessao.situacao === 'INTERVALO' ? (
          <section className="space-y-5"><h2 className="text-xl font-semibold">Bloco {sessao.bloco_liberado} concluído</h2><p>Descanse o quanto quiser. Quando estiver pronto, continue para o próximo bloco.</p><p>{sessao.concluidas} de 27 tentativas concluídas.</p><button className={botao} disabled={ocupado} onClick={() => void continuar()}>Continuar</button></section>
        ) : sessao.proxima ? (
          <section className="bg-branco border border-destaque-claro rounded-2xl p-6 space-y-5">
            <p>Bloco {sessao.proxima.bloco} de 3 · tentativa {(sessao.proxima.ordem - 1) % 9 + 1} de 9</p>
            <h2 className="text-2xl font-semibold">Estime {sessao.proxima.tempo_alvo_ms / 1000} segundos</h2>
            <p>Toque em Iniciar tentativa. Depois, toque em Finalizar quando acreditar que o tempo terminou. Estime sem contar segundos ou bipes.</p>
            <p>Mantenha esta tela aberta durante a tentativa. Uma interrupção permite recomeçar a mesma tentativa.</p>
            <button className={botao} onClick={() => void rodada.iniciar(sessao.proxima!, sessao.volume)}>Iniciar tentativa</button>
            <p className="text-sm text-texto-secundario">{sessao.concluidas} de 27 tentativas concluídas. Os resultados ficam disponíveis no encerramento.</p>
          </section>
        ) : null}
      </main>
    </div>
  );
}

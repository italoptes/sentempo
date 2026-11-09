/** Agenda por posições absolutas no relógio de áudio, sem acumular deriva dos timers. */
export interface RelogioRitmo {
  agora: () => number;
  agendar: (acao: () => void, ms: number) => ReturnType<typeof setTimeout>;
  cancelar: (id: ReturnType<typeof setTimeout>) => void;
}

export function criarRitmoFixo(intervalo: number, emitir: (instante: number) => void,
  aoErro: (erro?: unknown) => void, relogio: RelogioRitmo) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let encerrado = false;
  let iniciado = false;
  let proximo = 0;
  function parar() {
    encerrado = true;
    if (timer !== undefined) relogio.cancelar(timer);
    timer = undefined;
  }
  function verificar() {
    if (encerrado) return;
    try {
      const agora = relogio.agora();
      // Um callback muito atrasado invalida a execução em vez de tocar bipes em rajada.
      if (proximo < agora - 0.05) throw new Error('Agendamento de áudio interrompido');
      while (proximo <= agora + 0.1) {
        emitir(proximo);
        proximo += intervalo;
      }
      timer = relogio.agendar(verificar, 25);
    } catch (erro) {
      parar();
      aoErro(erro);
    }
  }
  return {
    iniciar() {
      if (iniciado || encerrado) return;
      iniciado = true;
      proximo = relogio.agora(); // Primeiro bip no início efetivo.
      verificar();
    }, parar,
  };
}

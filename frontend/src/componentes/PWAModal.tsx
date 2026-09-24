import { useState, useEffect } from 'react';

// Interfaces estendidas para suporte ao BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAModal() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [mostrarPromptInstalacao, setMostrarPromptInstalacao] = useState(false);
  const [animando, setAnimando] = useState(false);
  const [instrucoesManual, setInstrucoesManual] = useState(false);

  useEffect(() => {
    // Verifica se já está instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in window.navigator && (window.navigator as any).standalone);
    const hasInstalled = localStorage.getItem('pwa_installed');

    if (isStandalone || hasInstalled) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Quando receber o evento, mostra o modal
      setMostrarPromptInstalacao(true);
      setTimeout(() => setAnimando(true), 10);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleRecusarPWA();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleInstalarPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        localStorage.setItem('pwa_installed', 'true');
      }
      setDeferredPrompt(null);
      fecharModal();
    } else {
      setInstrucoesManual(true);
    }
  };

  const fecharModal = () => {
    setAnimando(false);
    setTimeout(() => {
      setMostrarPromptInstalacao(false);
      setInstrucoesManual(false);
    }, 300);
  };

  const handleRecusarPWA = () => {
    fecharModal();
  };

  if (!mostrarPromptInstalacao) return null;

  return (
    <>
      {/* Overlay Escuro */}
      <div 
        className={`fixed inset-0 z-50 flex items-end justify-center transition-all duration-300 ${animando ? 'bg-black/40' : 'bg-black/0'}`}
        onClick={handleRecusarPWA}
      >
        {/* Container Principal (Card) */}
        <div 
          className={`w-[90%] max-w-sm bg-white rounded-t-3xl shadow-2xl overflow-hidden transition-transform duration-300 ease-out mb-0 sm:mb-4 sm:rounded-b-3xl ${animando ? 'translate-y-0 sm:translate-y-0' : 'translate-y-full sm:translate-y-[150%]'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cabeçalho */}
          <div className="bg-[#0F2D2E] rounded-t-3xl pt-2 pb-6 px-4 flex flex-col items-center relative">
            {/* Pill de arrastar */}
            <div className="w-10 h-1 bg-white/20 rounded-full mb-4"></div>
            
            {/* Ícone */}
            <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-3">
              <svg className="w-10 h-10 text-[#00C2A8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h2 className="text-white text-xl font-bold">Instale o Sentempo</h2>
            <p className="text-white/80 text-sm mt-1">Acesso rápido na sua tela inicial</p>
          </div>

          {/* Conteúdo Central */}
          <div className="px-6 py-5 flex flex-col gap-4">
            {!instrucoesManual ? (
              <ul className="flex flex-col gap-3">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#00C2A8] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-semibold text-slate-600">Acesso instantâneo sem abrir o navegador</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#00C2A8] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-semibold text-slate-600">Funciona offline com sincronização posterior</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#00C2A8] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-semibold text-slate-600">Registre dados mesmo sem sinal de internet</span>
                </li>
              </ul>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-bold text-slate-700 mb-1">Como instalar manualmente:</p>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#0F2D2E] text-white flex items-center justify-center text-xs shrink-0 mt-0.5">1</div>
                  <span className="text-sm font-medium text-slate-600">Toque no ícone de compartilhar ou menu do navegador.</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#0F2D2E] text-white flex items-center justify-center text-xs shrink-0 mt-0.5">2</div>
                  <span className="text-sm font-medium text-slate-600">Selecione "Adicionar à tela inicial".</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#0F2D2E] text-white flex items-center justify-center text-xs shrink-0 mt-0.5">3</div>
                  <span className="text-sm font-medium text-slate-600">Confirme a instalação.</span>
                </div>
              </div>
            )}
          </div>

          {/* Rodapé (Botões) */}
          <div className="border-t border-slate-100 px-5 pt-3 pb-5 flex gap-3">
            <button 
              onClick={handleRecusarPWA}
              className="flex-1 bg-slate-100 text-slate-500 rounded-xl py-2.5 text-sm font-bold hover:bg-slate-200 transition-colors"
            >
              {instrucoesManual ? "Fechar" : "Agora não"}
            </button>
            
            {!instrucoesManual && (
              <button 
                onClick={handleInstalarPWA}
                className="flex-1 bg-[#00C2A8] text-white rounded-xl py-2.5 text-sm font-bold shadow-md hover:bg-[#00a892] transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Instalar
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

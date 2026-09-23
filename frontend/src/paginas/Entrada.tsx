// paginas/Entrada.tsx — Tela de entrada do participante (rota /)

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { acessarParticipante } from '../servicos/participantes';
import { validarNome, validarCodigo } from '../utilitarios/validacao';
import { ErroAPI } from '../servicos/api';

interface Props {
  onParticipanteDefinido: (id: string) => void;
}

export function Entrada({ onParticipanteDefinido }: Props) {
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('');
  const [erroNome, setErroNome] = useState<string | null>(null);
  const [erroCodigo, setErroCodigo] = useState<string | null>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErroGeral(null);

    const eNome = validarNome(nome);
    const eCodigo = validarCodigo(codigo);
    setErroNome(eNome);
    setErroCodigo(eCodigo);
    if (eNome || eCodigo) return;

    setCarregando(true);
    try {
      const participante = await acessarParticipante(nome.trim(), codigo);
      onParticipanteDefinido(participante.id);
      navigate('/inicio');
    } catch (e) {
      if (e instanceof ErroAPI && e.status === 422) {
        setErroGeral('Dados inválidos. Verifique o nome e o código.');
      } else {
        setErroGeral(e instanceof Error ? e.message : 'Erro de conexão. Tente novamente.');
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen bg-fundo flex flex-col items-center justify-center px-4 py-12 pagina-entrar">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <img
            src="/images/logo_principal.png"
            alt="Sentempo — Sinta o Tempo"
            className="h-16 mx-auto object-contain"
          />
        </div>

        {/* Card de acesso */}
        <div className="bg-branco rounded-2xl shadow-sm border border-destaque-claro p-8">
          <h1 className="text-xl font-semibold text-principal mb-2">Entrar no experimento</h1>
          <p className="text-texto-secundario text-sm mb-6">
            Informe seu nome e código de quatro dígitos para participar. Use fones de ouvido para melhor experiência — o experimento inclui sons.
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Nome */}
            <div>
              <label htmlFor="campo-nome" className="block text-sm font-medium text-principal mb-1">
                Nome
              </label>
              <input
                id="campo-nome"
                type="text"
                autoComplete="name"
                value={nome}
                onChange={(e) => { setNome(e.target.value); setErroNome(null); }}
                placeholder="Ex.: Ana Silva"
                maxLength={120}
                aria-describedby={erroNome ? 'erro-nome' : undefined}
                aria-invalid={!!erroNome}
                className={`w-full px-4 py-3 rounded-xl border bg-branco text-principal text-sm
                  focus:outline-none focus:ring-2 transition-colors
                  ${erroNome ? 'border-red-400 focus:ring-red-200' : 'border-destaque-claro focus:border-destaque focus:ring-destaque/20'}`}
              />
              {erroNome && (
                <p id="erro-nome" role="alert" className="text-red-600 text-xs mt-1">{erroNome}</p>
              )}
            </div>

            {/* Código */}
            <div>
              <label htmlFor="campo-codigo" className="block text-sm font-medium text-principal mb-1">
                Código <span className="text-texto-secundario font-normal">(4 dígitos)</span>
              </label>
              <input
                id="campo-codigo"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                value={codigo}
                onChange={(e) => { setCodigo(e.target.value.replace(/\D/g, '').slice(0, 4)); setErroCodigo(null); }}
                placeholder="0042"
                aria-describedby={erroCodigo ? 'erro-codigo' : undefined}
                aria-invalid={!!erroCodigo}
                className={`w-full px-4 py-3 rounded-xl border bg-branco text-principal text-sm font-mono tracking-widest
                  focus:outline-none focus:ring-2 transition-colors
                  ${erroCodigo ? 'border-red-400 focus:ring-red-200' : 'border-destaque-claro focus:border-destaque focus:ring-destaque/20'}`}
              />
              {erroCodigo && (
                <p id="erro-codigo" role="alert" className="text-red-600 text-xs mt-1">{erroCodigo}</p>
              )}
            </div>

            {erroGeral && (
              <p role="alert" className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{erroGeral}</p>
            )}

            <button
              id="btn-entrar"
              type="submit"
              disabled={carregando}
              className="w-full py-3 bg-destaque text-principal font-semibold rounded-xl
                hover:bg-[#00a890] active:scale-95 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-destaque
                disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

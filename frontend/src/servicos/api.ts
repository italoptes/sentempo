// servicos/api.ts — Cliente HTTP centralizado

const URL_BASE = import.meta.env.VITE_URL_API ?? '/api';

type MetodoHTTP = 'GET' | 'POST';

interface OpcoesRequisicao {
  metodo?: MetodoHTTP;
  corpo?: unknown;
  token?: string | null;
}

export class ErroAPI extends Error {
  readonly status: number;
  readonly detalhe: string;

  constructor(status: number, detalhe: string) {
    super(detalhe);
    this.name = 'ErroAPI';
    this.status = status;
    this.detalhe = detalhe;
  }
}

export async function requisicao<T>(
  caminho: string,
  { metodo = 'GET', corpo, token }: OpcoesRequisicao = {},
): Promise<T> {
  const cabecalhos: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    cabecalhos['Authorization'] = `Bearer ${token}`;
  }

  const resposta = await fetch(`${URL_BASE}${caminho}`, {
    method: metodo,
    headers: cabecalhos,
    body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
  });

  if (!resposta.ok) {
    let mensagem = `Erro ${resposta.status}`;
    try {
      const dados = await resposta.json() as { detail?: string; mensagem?: string };
      mensagem = dados.mensagem ?? dados.detail ?? mensagem;
    } catch {
      // ignora erro de parse
    }
    throw new ErroAPI(resposta.status, mensagem);
  }

  // Para respostas sem corpo (204)
  if (resposta.status === 204) {
    return undefined as T;
  }

  return resposta.json() as Promise<T>;
}

// utilitarios/validacao.ts — Funções de validação de entrada

/** Valida nome: não vazio após trim e no máximo 120 caracteres */
export function validarNome(nome: string): string | null {
  const limpo = nome.trim();
  if (!limpo) return 'O nome não pode ser vazio.';
  if (limpo.length > 120) return 'O nome deve ter no máximo 120 caracteres.';
  return null;
}

/** Valida código: exatamente 4 dígitos numéricos */
export function validarCodigo(codigo: string): string | null {
  if (!/^[0-9]{4}$/.test(codigo)) {
    return 'O código deve ter exatamente 4 dígitos numéricos.';
  }
  return null;
}

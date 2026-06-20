/**
 * cpf.ts — Validação e formatação de CPF
 *
 * Validação: algoritmo oficial da Receita Federal (módulo 11).
 * Formatação: aplica máscara 000.000.000-00 em tempo real.
 */

/** Aplica máscara de CPF conforme o usuário digita */
export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/** Valida CPF com algoritmo de dígitos verificadores */
export function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");

  if (digits.length !== 11) return false;

  // Rejeita CPFs com todos os dígitos iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(digits)) return false;

  // Primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i);
  }
  let remainder = sum % 11;
  const firstCheck = remainder < 2 ? 0 : 11 - remainder;
  if (parseInt(digits[9]) !== firstCheck) return false;

  // Segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i);
  }
  remainder = sum % 11;
  const secondCheck = remainder < 2 ? 0 : 11 - remainder;

  return parseInt(digits[10]) === secondCheck;
}

/** Aplica máscara de telefone: (00) 00000-0000 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** Aplica máscara de data: DD/MM/AAAA */
export function formatDate(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Converte DD/MM/AAAA para objeto Date (ou null se inválido) */
export function parseDateBR(value: string): Date | null {
  const parts = value.split("/");
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const year = parseInt(parts[2]);
  if (!day || !month || !year || year < 1900 || year > new Date().getFullYear()) return null;
  const date = new Date(year, month - 1, day);
  if (date.getDate() !== day || date.getMonth() !== month - 1) return null;
  return date;
}

/**
 * Utilitários gerais do projeto
 */

/**
 * Formata um valor numérico em moeda BRL.
 * Aceita number OU string (Prisma Decimal vem como string em JSON).
 *
 * Exemplo: 289.9 → "R$ 289,90"
 */
export function formatPrice(value: number | string): string {
  const numeric = typeof value === "string" ? parseFloat(value) : value;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numeric);
}

/**
 * Gera um link do WhatsApp com mensagem pré-preenchida.
 */
export function whatsappLink(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Converte um nome em slug URL-friendly.
 *
 * Exemplos:
 * "Joias Finas" → "joias-finas"
 * "Vestido Midi & Floral" → "vestido-midi-floral"
 * "Ação especial!" → "acao-especial"
 */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

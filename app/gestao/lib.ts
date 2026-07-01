/** Utilitários compartilhados do app de gestão. */

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function brl(value: number | string | null | undefined): string {
  if (value == null) return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "—";
  return BRL.format(n);
}

export type StockLevel = "zero" | "low" | "ok";

export function stockLevel(qty: number, threshold = 5): StockLevel {
  if (qty <= 0) return "zero";
  if (qty <= threshold) return "low";
  return "ok";
}

/** Remove acentos e baixa a caixa — para busca tolerante. */
export function normalize(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

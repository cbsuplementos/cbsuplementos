/**
 * product-stock.ts — Regra ÚNICA de estoque e preço exibidos.
 *
 * Motivação (auditoria 02/07/2026): o sistema tinha três definições de
 * "estoque" convivendo — a lista do admin lia `product.stock` (0 para
 * produtos com variações), o site marcava "Esgotado" por `product.stock`,
 * e o /gestao somava as variações. Este módulo centraliza a regra para
 * que todas as telas contem a mesma história.
 *
 * Regra:
 *  - Produto COM variações → estoque efetivo = soma do estoque das variações.
 *  - Produto SEM variações → estoque efetivo = product.stock
 *    (null = sem controle de estoque: o site vende sem limite).
 */

interface VariantStockLike {
  stock: number;
}

interface VariantPriceLike {
  price: unknown; // Prisma Decimal | string | number
}

/**
 * Estoque efetivo de um produto.
 * Retorna `null` apenas para produto simples com stock null (sem controle).
 */
export function effectiveStock(
  productStock: number | null | undefined,
  variants: VariantStockLike[]
): number | null {
  if (variants.length > 0) {
    return variants.reduce((sum, v) => sum + v.stock, 0);
  }
  return productStock ?? null;
}

/**
 * True quando o produto deve aparecer como "Esgotado".
 * (null = sem controle ⇒ nunca esgotado.)
 */
export function isOutOfStock(
  productStock: number | null | undefined,
  variants: VariantStockLike[]
): boolean {
  return effectiveStock(productStock, variants) === 0;
}

/**
 * Menor preço de venda entre as variações (ou o preço do produto, se
 * simples). Usado para exibir "a partir de R$ X" em listagens.
 */
export function startingPrice(
  productPrice: unknown,
  variants: VariantPriceLike[]
): number {
  const toNumber = (v: unknown) => Number(String(v));
  if (variants.length > 0) {
    const candidates = variants
      .map((v) => toNumber(v.price))
      .filter((n) => Number.isFinite(n));
    if (candidates.length > 0) return Math.min(...candidates);
  }
  return toNumber(productPrice);
}

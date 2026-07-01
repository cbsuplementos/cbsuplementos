import { prisma } from "@/lib/db";
import { StockMovementType } from "@prisma/client";

/**
 * lib/stock.ts — Operações de estoque atômicas e auditáveis.
 *
 * Toda mudança de estoque passa por aqui e gera uma linha em StockMovement
 * (o livro-razão), com o saldo antes e depois. Isso dá rastro completo:
 * dá pra responder "por que este produto está com 7 e não 10?".
 *
 * Concorrência: como o site público e este app podem dar baixa no mesmo
 * produto ao mesmo tempo, os decrementos usam `updateMany` com guarda
 * `stock >= quantidade` dentro de uma transação. Se dois pedidos disputam
 * o último item, só um passa — o outro recebe StockError. Nunca vende a
 * descoberto (mesmo princípio do webhook do Mercado Pago).
 */

export class StockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StockError";
  }
}

interface Target {
  productId?: string | null;
  variantId?: string | null;
}

/**
 * Aplica um delta de estoque (positivo = entrada, negativo = saída).
 * Usado por venda (SAIDA_VENDA_APP) e entrada (ENTRADA).
 */
export async function applyStockDelta(
  input: Target & {
    type: StockMovementType;
    delta: number;
    reason?: string | null;
    reference?: string | null;
    userId?: string | null;
  }
): Promise<{ stockBefore: number; stockAfter: number }> {
  const variantId = input.variantId ?? null;
  const productId = input.productId ?? null;
  const { delta, type } = input;

  if (!variantId && !productId) throw new StockError("Produto ou variante não informado.");
  if (!Number.isInteger(delta) || delta === 0) throw new StockError("Quantidade inválida.");

  return prisma.$transaction(async (tx) => {
    let after: number;
    let linkedProductId = productId;

    if (variantId) {
      if (delta < 0) {
        const res = await tx.variant.updateMany({
          where: { id: variantId, stock: { gte: -delta } },
          data: { stock: { decrement: -delta } },
        });
        if (res.count === 0) throw new StockError("Estoque insuficiente para esta variante.");
      } else {
        const res = await tx.variant.updateMany({
          where: { id: variantId },
          data: { stock: { increment: delta } },
        });
        if (res.count === 0) throw new StockError("Variante não encontrada.");
      }
      const v = await tx.variant.findUnique({
        where: { id: variantId },
        select: { stock: true, productId: true },
      });
      after = v!.stock;
      linkedProductId = v!.productId;
    } else {
      if (delta < 0) {
        const res = await tx.product.updateMany({
          where: { id: productId!, stock: { gte: -delta } },
          data: { stock: { decrement: -delta } },
        });
        if (res.count === 0) throw new StockError("Estoque insuficiente para este produto.");
      } else {
        const res = await tx.product.updateMany({
          where: { id: productId! },
          data: { stock: { increment: delta } },
        });
        if (res.count === 0) throw new StockError("Produto não encontrado.");
      }
      const p = await tx.product.findUnique({
        where: { id: productId! },
        select: { stock: true },
      });
      after = p!.stock ?? 0;
    }

    await tx.stockMovement.create({
      data: {
        type,
        quantity: delta,
        stockBefore: after - delta,
        stockAfter: after,
        reason: input.reason ?? null,
        reference: input.reference ?? null,
        productId: linkedProductId,
        variantId,
        userId: input.userId ?? null,
      },
    });

    return { stockBefore: after - delta, stockAfter: after };
  });
}

/**
 * Define o estoque para um valor absoluto (ajuste manual / contagem).
 * Registra a diferença como movimento do tipo AJUSTE.
 */
export async function setStockAbsolute(
  input: Target & {
    setTo: number;
    reason?: string | null;
    userId?: string | null;
  }
): Promise<{ stockBefore: number; stockAfter: number }> {
  const variantId = input.variantId ?? null;
  const productId = input.productId ?? null;
  const after = input.setTo;

  if (!variantId && !productId) throw new StockError("Produto ou variante não informado.");
  if (!Number.isInteger(after) || after < 0) throw new StockError("Quantidade inválida.");

  return prisma.$transaction(async (tx) => {
    let before: number;
    let linkedProductId = productId;

    if (variantId) {
      const v = await tx.variant.findUnique({
        where: { id: variantId },
        select: { stock: true, productId: true },
      });
      if (!v) throw new StockError("Variante não encontrada.");
      before = v.stock;
      linkedProductId = v.productId;
      if (before !== after) {
        await tx.variant.update({ where: { id: variantId }, data: { stock: after } });
      }
    } else {
      const p = await tx.product.findUnique({
        where: { id: productId! },
        select: { stock: true },
      });
      if (!p) throw new StockError("Produto não encontrado.");
      before = p.stock ?? 0;
      if (before !== after) {
        await tx.product.update({ where: { id: productId! }, data: { stock: after } });
      }
    }

    await tx.stockMovement.create({
      data: {
        type: StockMovementType.AJUSTE,
        quantity: after - before,
        stockBefore: before,
        stockAfter: after,
        reason: input.reason ?? null,
        productId: linkedProductId,
        variantId,
        userId: input.userId ?? null,
      },
    });

    return { stockBefore: before, stockAfter: after };
  });
}

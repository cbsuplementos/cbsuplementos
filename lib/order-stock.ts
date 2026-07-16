import { prisma } from "@/lib/db";
import { StockMovementType } from "@prisma/client";
import { applyStockDelta, type TxClient } from "@/lib/stock";

/**
 * lib/order-stock.ts (E3) — Baixa e devolução de estoque de PEDIDOS DO SITE,
 * com ledger (SAIDA_VENDA_SITE / DEVOLUCAO) e idempotência.
 *
 * A idempotência vem de dois carimbos no próprio pedido:
 *   stockDebitedAt  — quando a venda baixou o estoque
 *   stockReturnedAt — quando o cancelamento devolveu
 *
 * Estados possíveis:
 *   (null, null)   → nunca baixou   → debit() baixa; return() é no-op
 *   (data, null)   → baixado agora  → debit() é no-op; return() devolve
 *   (data, data)   → devolvido      → debit() baixa DE NOVO (reativação)
 *                                     e zera stockReturnedAt
 *
 * Isso cobre: webhook duplicado do MP (baixa 1x), cancelar 2x (devolve 1x),
 * e cancelar → reativar → cancelar (baixa e devolve de novo, correto).
 *
 * allowNegative na baixa: a venda JÁ aconteceu (dinheiro recebido); se uma
 * corrida deixou o saldo curto, registra negativo em vez de falhar — o
 * admin vê o vermelho e ajusta. A devolução é incremento, sempre segura.
 */

export type OrderStockOrigin = "ADMIN" | "WEBHOOK";

export interface OrderStockResult {
  /** true se a operação realmente mexeu no estoque nesta chamada. */
  done: boolean;
  /** Quantidade de itens do pedido processados (0 quando no-op). */
  items: number;
}

interface Opts {
  origin: OrderStockOrigin;
  userId?: string | null;
  /** Transação externa: quando presente, tudo roda dentro dela. */
  tx?: TxClient;
}

async function loadOrder(tx: TxClient, orderId: string) {
  return tx.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      stockDebitedAt: true,
      stockReturnedAt: true,
      items: {
        select: { productId: true, variantId: true, quantity: true },
      },
    },
  });
}

/**
 * Baixa o estoque de todos os itens do pedido (SAIDA_VENDA_SITE).
 * No-op se o pedido já está com estoque baixado (e não devolvido).
 */
export async function debitOrderStock(
  orderId: string,
  opts: Opts
): Promise<OrderStockResult> {
  const run = async (tx: TxClient): Promise<OrderStockResult> => {
    const order = await loadOrder(tx, orderId);
    if (!order) throw new Error(`Pedido ${orderId} não encontrado.`);

    const jaBaixado = order.stockDebitedAt !== null && order.stockReturnedAt === null;
    if (jaBaixado) return { done: false, items: 0 };

    const reason =
      opts.origin === "ADMIN"
        ? `Venda no site — pedido ${order.orderNumber} (confirmação manual)`
        : `Venda no site — pedido ${order.orderNumber}`;

    for (const item of order.items) {
      await applyStockDelta({
        productId: item.variantId ? null : item.productId,
        variantId: item.variantId,
        type: StockMovementType.SAIDA_VENDA_SITE,
        delta: -item.quantity,
        reason,
        reference: order.orderNumber,
        userId: opts.userId ?? null,
        allowNegative: true,
        tx,
      });
    }

    await tx.order.update({
      where: { id: order.id },
      data: { stockDebitedAt: new Date(), stockReturnedAt: null },
    });

    return { done: true, items: order.items.length };
  };

  return opts.tx ? run(opts.tx) : prisma.$transaction(run);
}

/**
 * Devolve o estoque de todos os itens do pedido (DEVOLUCAO).
 * Só age se o pedido está com estoque baixado e ainda não devolvido —
 * cancelar um PENDING (que nunca baixou) é no-op, como deve ser.
 */
export async function returnOrderStock(
  orderId: string,
  opts: Opts
): Promise<OrderStockResult> {
  const run = async (tx: TxClient): Promise<OrderStockResult> => {
    const order = await loadOrder(tx, orderId);
    if (!order) throw new Error(`Pedido ${orderId} não encontrado.`);

    const baixadoAgora = order.stockDebitedAt !== null && order.stockReturnedAt === null;
    if (!baixadoAgora) return { done: false, items: 0 };

    const reason =
      opts.origin === "ADMIN"
        ? `Devolução — cancelamento do pedido ${order.orderNumber} (admin)`
        : `Devolução — cancelamento do pedido ${order.orderNumber}`;

    for (const item of order.items) {
      await applyStockDelta({
        productId: item.variantId ? null : item.productId,
        variantId: item.variantId,
        type: StockMovementType.DEVOLUCAO,
        delta: item.quantity,
        reason,
        reference: order.orderNumber,
        userId: opts.userId ?? null,
        tx,
      });
    }

    await tx.order.update({
      where: { id: order.id },
      data: { stockReturnedAt: new Date() },
    });

    return { done: true, items: order.items.length };
  };

  return opts.tx ? run(opts.tx) : prisma.$transaction(run);
}

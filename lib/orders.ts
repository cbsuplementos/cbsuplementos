import { prisma } from "@/lib/db";

/**
 * orders.ts — Expiração de pedidos PENDING não pagos
 *
 * Por que "lazy" (sob demanda) e não cron:
 * 1. O Railway não oferece cron confiável no plano padrão.
 * 2. Não é necessário: basta verificar e cancelar nos momentos em que
 *    alguém olha (polling do Pix, lista do admin, "Meus Pedidos").
 *
 * Segurança de estoque: o estoque só é decrementado quando o pagamento é
 * APROVADO (no webhook, via prisma.$transaction). Um pedido PENDING nunca
 * reservou estoque, então cancelá-lo NÃO exige devolver estoque.
 */

export const PENDING_ORDER_TIMEOUT_MINUTES = 30;

/**
 * Cancela em massa todos os pedidos PENDING criados há mais de
 * PENDING_ORDER_TIMEOUT_MINUTES minutos. Retorna a quantidade cancelada.
 *
 * Idempotente e seguro para chamar com frequência (no carregamento de
 * telas). Falhas são engolidas (log) para nunca quebrar a página que chamou.
 */
export async function expireStalePendingOrders(): Promise<number> {
  const cutoff = new Date(Date.now() - PENDING_ORDER_TIMEOUT_MINUTES * 60 * 1000);

  try {
    const result = await prisma.order.updateMany({
      where: {
        status: "PENDING",
        createdAt: { lt: cutoff },
      },
      data: {
        status: "CANCELLED",
        paymentStatus: "expired",
      },
    });

    if (result.count > 0) {
      console.log(`[ORDERS] ${result.count} pedido(s) cancelado(s) por expiração.`);
    }

    return result.count;
  } catch (error) {
    console.error("[ORDERS] Erro ao expirar pedidos:", error);
    return 0;
  }
}

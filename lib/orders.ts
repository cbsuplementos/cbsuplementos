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
    const stale = await prisma.order.findMany({
      where: { status: "PENDING", createdAt: { lt: cutoff } },
      select: { id: true },
    });
    if (stale.length === 0) return 0;

    let cancelled = 0;

    // Um a um com guarda de status: se o webhook aprovar o pagamento
    // entre o findMany e o update, o pedido escapa do cancelamento —
    // e o log de auditoria (QW6) só é criado para quem realmente expirou.
    await prisma.$transaction(async (tx) => {
      for (const { id } of stale) {
        const res = await tx.order.updateMany({
          where: { id, status: "PENDING" },
          data: { status: "CANCELLED", paymentStatus: "expired" },
        });
        if (res.count === 1) {
          await tx.orderStatusLog.create({
            data: {
              orderId: id,
              fromStatus: "PENDING" as never,
              toStatus: "CANCELLED" as never,
              origin: "SYSTEM",
              note: `Expirado automaticamente (Pix não pago em ${PENDING_ORDER_TIMEOUT_MINUTES} min)`,
            },
          });
          cancelled++;
        }
      }
    });

    if (cancelled > 0) {
      console.log(`[ORDERS] ${cancelled} pedido(s) cancelado(s) por expiração.`);
    }

    return cancelled;
  } catch (error) {
    console.error("[ORDERS] Erro ao expirar pedidos:", error);
    return 0;
  }
}

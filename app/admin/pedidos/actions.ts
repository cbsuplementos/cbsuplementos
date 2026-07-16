"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { debitOrderStock, returnOrderStock } from "@/lib/order-stock";

/**
 * Server Actions de Pedidos (E3 + QW6)
 *
 * updateOrderStatus concentra TODA mudança manual de status:
 *  - efeitos de estoque (baixa ao marcar como pago; devolução ao
 *    cancelar/reembolsar), idempotentes via carimbos do pedido;
 *  - trilha de auditoria em OrderStatusLog (quem, quando, de→para);
 *  - tudo numa única transação — ou acontece inteiro, ou nada.
 */

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado");
  return session;
}

const VALID_STATUSES = [
  "PENDING",
  "PAYMENT_APPROVED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

const PAID_FAMILY = ["PAYMENT_APPROVED", "PROCESSING", "SHIPPED", "DELIVERED"];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Aguardando pagamento",
  PAYMENT_APPROVED: "Pago",
  PROCESSING: "Em preparação",
  SHIPPED: "Saiu para entrega",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

type UpdateResult = { success: true; message: string } | { error: string };

export async function updateOrderStatus(input: {
  orderId: string;
  status: string;
  trackingCode?: string;
}): Promise<UpdateResult> {
  const session = await requireAuth();
  const userId = (session.user as { id?: string } | undefined)?.id ?? null;

  const { orderId } = input;
  const to = input.status;
  if (!orderId || typeof orderId !== "string")
    return { error: "Pedido inválido." };
  if (!VALID_STATUSES.includes(to as (typeof VALID_STATUSES)[number]))
    return { error: "Status inválido." };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          trackingCode: true,
          paidAt: true,
        },
      });
      if (!order) return { error: "Pedido não encontrado." as const };

      const from = order.status;
      const tracking = (input.trackingCode ?? "").trim();
      const data: Record<string, unknown> = {};
      const messages: string[] = [];
      let stockNote: string | null = null;

      if (tracking && tracking !== order.trackingCode) {
        data.trackingCode = tracking;
        messages.push("Rastreio atualizado.");
      }

      if (to !== from) {
        data.status = to;

        if (PAID_FAMILY.includes(to)) {
          // Entrou na família "pago": garante paidAt e baixa o estoque
          // (no-op se o webhook já baixou — idempotência nos carimbos).
          data.paidAt = order.paidAt ?? new Date();
          const r = await debitOrderStock(order.id, {
            origin: "ADMIN",
            userId,
            tx,
          });
          if (r.done) {
            stockNote = `Estoque baixado (${r.items} ite${r.items === 1 ? "m" : "ns"})`;
          }
        } else if (to === "CANCELLED" || to === "REFUNDED") {
          // Devolve o estoque SE (e só se) ele foi baixado e ainda não
          // devolvido. Cancelar um PENDING não devolve nada.
          const r = await returnOrderStock(order.id, {
            origin: "ADMIN",
            userId,
            tx,
          });
          if (r.done) {
            stockNote = `Estoque devolvido (${r.items} ite${r.items === 1 ? "m" : "ns"})`;
          }
        }

        await tx.orderStatusLog.create({
          data: {
            orderId: order.id,
            fromStatus: from as never,
            toStatus: to as never,
            origin: "ADMIN",
            userId,
            note: stockNote,
          },
        });

        messages.unshift(`Status: ${STATUS_LABELS[from]} → ${STATUS_LABELS[to]}.`);
        if (stockNote) messages.push(`${stockNote}.`);
      }

      if (Object.keys(data).length === 0) {
        return { success: true as const, message: "Nada a alterar." };
      }

      await tx.order.update({ where: { id: order.id }, data });

      return { success: true as const, message: messages.join(" ") };
    });

    if ("success" in result) {
      revalidatePath(`/admin/pedidos/${orderId}`);
      revalidatePath("/admin/pedidos");
    }
    return result;
  } catch (e) {
    console.error("[updateOrderStatus]", e);
    return { error: "Erro ao atualizar o pedido. Tente novamente." };
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrder } from "@/lib/mercadopago";
import { debitOrderStock, returnOrderStock } from "@/lib/order-stock";

/**
 * Webhook do Mercado Pago
 *
 * Segurança: em vez de validar assinatura (que o MP calcula de forma
 * inconsistente entre versões), verificamos o pedido DIRETAMENTE na
 * API do MP com nosso Access Token. Isso garante que o status é real
 * — um atacante não consegue forjar uma resposta da API do MP.
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    console.log("[WEBHOOK] Notificação recebida:", JSON.stringify(body).substring(0, 500));

    const resourceId = body.data?.id || body.resource;

    if (!resourceId) {
      console.log("[WEBHOOK] Sem resourceId — ignorado");
      return NextResponse.json({ received: true });
    }

    // Busca o pedido DIRETAMENTE na API do MP (segurança real)
    let mpOrder;
    try {
      mpOrder = await getOrder(resourceId.toString());
      console.log("[WEBHOOK] MP Order status:", mpOrder.status, "| external_ref:", mpOrder.external_reference);
    } catch {
      console.log("[WEBHOOK] Não foi possível buscar order:", resourceId);
      return NextResponse.json({ received: true });
    }

    if (!mpOrder.external_reference) {
      console.log("[WEBHOOK] Sem external_reference");
      return NextResponse.json({ received: true });
    }

    // Busca o pedido no nosso banco
    const order = await prisma.order.findUnique({
      where: { id: mpOrder.external_reference },
    });

    if (!order) {
      console.log("[WEBHOOK] Pedido não encontrado:", mpOrder.external_reference);
      return NextResponse.json({ received: true });
    }

    // Atualiza o status
    const mpPayment = mpOrder.transactions?.payments?.[0];
    const paymentStatus = mpPayment?.status || mpOrder.status;

    const updateData: Record<string, unknown> = {
      paymentStatus,
      mpPaymentId: mpPayment?.id || order.mpPaymentId,
    };

    // Família "pago": estados em que o estoque já foi (ou deve ser) baixado
    // e que o webhook NÃO pode rebaixar (um webhook atrasado de "approved"
    // não pode voltar um pedido já em preparação/entregue para "Pago").
    const paidFamily = ["PAYMENT_APPROVED", "PROCESSING", "SHIPPED", "DELIVERED"];

    let stockNote: string | null = null;

    if (paymentStatus === "approved" || paymentStatus === "processed") {
      if (!paidFamily.includes(order.status)) {
        updateData.status = "PAYMENT_APPROVED";
      }
      updateData.paidAt = order.paidAt ?? new Date();

      // BAIXA DE ESTOQUE com ledger SAIDA_VENDA_SITE (E3).
      // Idempotente via carimbos do pedido — o MP pode reenviar o webhook
      // quantas vezes quiser que a baixa acontece uma única vez.
      const debit = await debitOrderStock(order.id, { origin: "WEBHOOK" });
      if (debit.done) {
        stockNote = `Estoque baixado (${debit.items} item${debit.items === 1 ? "" : "ns"})`;
        console.log(`[WEBHOOK] Estoque baixado: ${debit.items} itens do pedido ${order.orderNumber}`);
      }
    } else if (paymentStatus === "rejected" || paymentStatus === "cancelled") {
      // Só cancela automaticamente se ainda não entrou em preparação/entrega
      // — a partir daí a decisão é do admin (que devolve estoque ao cancelar).
      if (order.status === "PENDING" || order.status === "PAYMENT_APPROVED") {
        updateData.status = "CANCELLED";

        // DEVOLUÇÃO (E3): se este pedido já tinha baixado estoque
        // (ex.: aprovado e depois estornado), devolve com DEVOLUCAO.
        const ret = await returnOrderStock(order.id, { origin: "WEBHOOK" });
        if (ret.done) {
          stockNote = `Estoque devolvido (${ret.items} item${ret.items === 1 ? "" : "ns"})`;
          console.log(`[WEBHOOK] Estoque devolvido: ${ret.items} itens do pedido ${order.orderNumber}`);
        }
      } else {
        console.log(`[WEBHOOK] MP diz "${paymentStatus}" mas pedido ${order.orderNumber} está ${order.status} — status mantido para decisão do admin.`);
      }
    }

    await prisma.order.update({
      where: { id: order.id },
      data: updateData,
    });

    // Trilha de auditoria (QW6): registra a transição feita pelo webhook
    const newStatus = updateData.status as string | undefined;
    if (newStatus && newStatus !== order.status) {
      await prisma.orderStatusLog.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: newStatus as never,
          origin: "WEBHOOK",
          note: [`MP: ${paymentStatus}`, stockNote].filter(Boolean).join(" · "),
        },
      });
    }

    console.log(`[WEBHOOK] ✅ Pedido ${order.orderNumber} → ${paymentStatus}`);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[WEBHOOK_ERROR]", error);
    return NextResponse.json({ received: true });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok" });
}

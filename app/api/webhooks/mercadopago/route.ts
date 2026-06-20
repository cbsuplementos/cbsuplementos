import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrder } from "@/lib/mercadopago";

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

    if (paymentStatus === "approved" || paymentStatus === "processed") {
      updateData.status = "PAYMENT_APPROVED";
      updateData.paidAt = new Date();

      // DECREMENTO DE ESTOQUE — apenas se o pedido ainda não foi processado
      // (idempotência: o MP pode mandar o webhook múltiplas vezes)
      if (order.status !== "PAYMENT_APPROVED") {
        const orderItems = await prisma.orderItem.findMany({
          where: { orderId: order.id },
          select: { productId: true, variantId: true, quantity: true },
        });

        // Transação atômica: tudo ou nada
        await prisma.$transaction(
          orderItems.map((item) => {
            if (item.variantId) {
              // Produto com variante → decrementa variant
              return prisma.variant.update({
                where: { id: item.variantId },
                data: { stock: { decrement: item.quantity } },
              });
            } else {
              // Produto simples → decrementa product
              return prisma.product.update({
                where: { id: item.productId },
                data: { stock: { decrement: item.quantity } },
              });
            }
          })
        );

        console.log(`[WEBHOOK] Estoque atualizado para ${orderItems.length} itens do pedido ${order.orderNumber}`);
      }
    } else if (paymentStatus === "rejected" || paymentStatus === "cancelled") {
      updateData.status = "CANCELLED";
    }

    await prisma.order.update({
      where: { id: order.id },
      data: updateData,
    });

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

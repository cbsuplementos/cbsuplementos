import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-auth";
import { prisma } from "@/lib/db";
import { PENDING_ORDER_TIMEOUT_MINUTES } from "@/lib/orders";

/**
 * GET /api/orders/check?numero=CB-XXXXX
 *
 * Retorna status do pedido + dados do Pix (qr_code, ticket_url)
 * Usado pelo polling da página de sucesso.
 */
export async function GET(request: Request) {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ paid: false }, { status: 401 });
  }

  const url = new URL(request.url);
  const numero = url.searchParams.get("numero");

  if (!numero) {
    return NextResponse.json({ paid: false }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber: numero },
    select: { customerId: true, status: true, paidAt: true, notes: true, paymentMethod: true, createdAt: true },
  });

  if (!order || order.customerId !== session.id) {
    return NextResponse.json({ paid: false }, { status: 404 });
  }

  let status = order.status;
  let expired = false;

  // Expiração sob demanda: o Mercado Pago não envia webhook quando um Pix
  // expira. Se este pedido está PENDING há mais que o timeout, cancela aqui.
  if (order.status === "PENDING") {
    const cutoff = new Date(Date.now() - PENDING_ORDER_TIMEOUT_MINUTES * 60 * 1000);
    if (order.createdAt < cutoff) {
      await prisma.order.update({
        where: { orderNumber: numero },
        data: { status: "CANCELLED", paymentStatus: "expired" },
      });
      status = "CANCELLED";
      expired = true;
    }
  }

  const paid = status === "PAYMENT_APPROVED" || !!order.paidAt;

  // Parse pix data do campo notes
  let pixData = null;
  if (order.paymentMethod === "pix" && order.notes) {
    try {
      pixData = JSON.parse(order.notes);
    } catch {
      pixData = null;
    }
  }

  return NextResponse.json({
    paid,
    status,
    expired,
    pixData,
  });
}

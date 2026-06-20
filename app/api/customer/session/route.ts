import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ customer: null });

  const cart = await prisma.cart.findUnique({
    where: { customerId: session.id },
    include: { items: true },
  });

  return NextResponse.json({
    customer: session,
    cartCount: cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0,
  });
}

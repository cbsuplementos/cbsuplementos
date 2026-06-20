import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCustomerToken } from "@/lib/customer-auth";
import { cookies } from "next/headers";

async function getCustomer() {
  const cookieStore = await cookies();
  const token = cookieStore.get("customer-token")?.value;
  if (!token) return null;
  return verifyCustomerToken(token);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const customer = await getCustomer();
  if (!customer) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;

  // Verificar que o endereço pertence ao cliente
  const address = await prisma.address.findFirst({
    where: { id, customerId: customer.id },
  });

  if (!address) {
    return NextResponse.json({ error: "Endereço não encontrado." }, { status: 404 });
  }

  // Verificar se tem pedidos vinculados
  const ordersCount = await prisma.order.count({ where: { addressId: id } });
  if (ordersCount > 0) {
    return NextResponse.json({ error: "Este endereço está vinculado a pedidos e não pode ser excluído." }, { status: 400 });
  }

  await prisma.address.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

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

// Listar endereços do cliente
export async function GET() {
  const customer = await getCustomer();
  if (!customer) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const addresses = await prisma.address.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ addresses });
}

// Criar novo endereço
export async function POST(request: Request) {
  const customer = await getCustomer();
  if (!customer) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const { label, recipientName, cep, street, number, complement, neighborhood, city, state } = await request.json();

    if (!cep || !street || !number || !neighborhood || !city || !state) {
      return NextResponse.json({ error: "Preencha todos os campos obrigatórios." }, { status: 400 });
    }

    const address = await prisma.address.create({
      data: {
        label: label || "Casa",
        recipientName: recipientName || customer.name,
        cep: cep.replace(/\D/g, ""),
        street,
        number,
        complement: complement || null,
        neighborhood,
        city,
        state: state.toUpperCase().slice(0, 2),
        customerId: customer.id,
      },
    });

    return NextResponse.json({ address });
  } catch (error) {
    console.error("[ADDRESS_CREATE_ERROR]", error);
    return NextResponse.json({ error: "Erro ao salvar endereço." }, { status: 500 });
  }
}

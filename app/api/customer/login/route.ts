import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createCustomerToken, setCustomerCookie } from "@/lib/customer-auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios." }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!customer) {
      return NextResponse.json({ error: "Email ou senha incorretos." }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, customer.password);
    if (!valid) {
      return NextResponse.json({ error: "Email ou senha incorretos." }, { status: 401 });
    }

    await prisma.cart.upsert({
      where: { customerId: customer.id },
      update: {},
      create: { customerId: customer.id },
    });

    const token = await createCustomerToken({
      id: customer.id, email: customer.email, name: customer.name,
    });

    const cookie = setCustomerCookie(token);
    const response = NextResponse.json({
      success: true,
      customer: { id: customer.id, name: customer.name, email: customer.email },
    });
    response.cookies.set(cookie.name, cookie.value, cookie.options as never);
    return response;
  } catch (error) {
    console.error("[LOGIN_ERROR]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

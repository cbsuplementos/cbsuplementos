import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createCustomerToken, setCustomerCookie } from "@/lib/customer-auth";

export async function POST(request: Request) {
  try {
    const { name, email, phone, cpf, birthDate, gender, password } = await request.json();

    // Validações obrigatórias
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nome, email e senha são obrigatórios." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "A senha deve ter pelo menos 8 caracteres." }, { status: 400 });
    }

    // Validação de CPF (formato: só dígitos)
    const cleanCpf = cpf ? cpf.replace(/\D/g, "") : null;
    if (cleanCpf && cleanCpf.length !== 11) {
      return NextResponse.json({ error: "CPF inválido." }, { status: 400 });
    }

    // Verificar email duplicado
    const existingEmail = await prisma.customer.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existingEmail) {
      return NextResponse.json({ error: "Este email já está cadastrado." }, { status: 409 });
    }

    // Verificar CPF duplicado (se informado)
    if (cleanCpf) {
      const existingCpf = await prisma.customer.findUnique({
        where: { cpf: cleanCpf },
      });
      if (existingCpf) {
        return NextResponse.json({ error: "Este CPF já está cadastrado." }, { status: 409 });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || null,
        cpf: cleanCpf || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        gender: gender || null,
        password: hashedPassword,
        cart: { create: {} },
      },
    });

    const token = await createCustomerToken({
      id: customer.id,
      email: customer.email,
      name: customer.name,
    });

    const cookie = setCustomerCookie(token);
    const response = NextResponse.json({
      success: true,
      customer: { id: customer.id, name: customer.name, email: customer.email },
    });
    response.cookies.set(cookie.name, cookie.value, cookie.options as never);
    return response;
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

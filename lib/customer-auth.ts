import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

/**
 * customer-auth.ts — Sistema de auth para clientes
 *
 * Separado do NextAuth (que é só para admin) para manter
 * as concerns isoladas. Usa JWT com jose (Edge-compatible).
 *
 * Cookie: "customer-token" (HttpOnly, Secure, SameSite=Lax)
 * Duração: 30 dias
 */

const COOKIE_NAME = "customer-token";
const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "fallback-secret-dev-only"
);

export interface CustomerSession {
  id: string;
  email: string;
  name: string;
}

// Gera JWT para o cliente
export async function createCustomerToken(customer: CustomerSession): Promise<string> {
  return new SignJWT({
    id: customer.id,
    email: customer.email,
    name: customer.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);
}

// Verifica e decodifica o JWT
export async function verifyCustomerToken(token: string): Promise<CustomerSession | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

// Lê a sessão do cliente a partir do cookie (Server Components / API Routes)
export async function getCustomerSession(): Promise<CustomerSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  return verifyCustomerToken(token);
}

// Busca o cliente completo no banco
export async function getCustomerWithData() {
  const session = await getCustomerSession();
  if (!session) return null;

  return prisma.customer.findUnique({
    where: { id: session.id },
    include: {
      addresses: { orderBy: { createdAt: "desc" } },
      cart: { include: { items: { include: { product: true, variant: true } } } },
    },
  });
}

// Seta o cookie do cliente na resposta
export function setCustomerCookie(token: string): { name: string; value: string; options: Record<string, unknown> } {
  return {
    name: COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 dias
    },
  };
}

// Nome do cookie (exportado para uso no middleware)
export const CUSTOMER_COOKIE_NAME = COOKIE_NAME;

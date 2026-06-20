import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client — Instância Singleton
 *
 * Por que isso é necessário:
 * Em desenvolvimento, o Next.js faz hot-reload e cria múltiplas instâncias
 * do PrismaClient, esgotando o pool de conexões do banco rapidamente.
 *
 * Solução: armazenar a instância no objeto `globalThis` em dev,
 * garantindo que sempre reusamos a mesma conexão.
 *
 * Em produção, isso não roda (NODE_ENV === "production"),
 * cada serverless function cria sua própria instância como esperado.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

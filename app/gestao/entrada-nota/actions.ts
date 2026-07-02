"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { applyStockDelta, StockError } from "@/lib/stock";
import { StockMovementType } from "@prisma/client";

/**
 * Grava em lote as entradas confirmadas de uma nota.
 * Cada item vira uma ENTRADA no estoque, com o número da nota como referência.
 * Quando o item tem código de fornecedor, guarda a equivalência
 * (código → produto/variante) para casar sozinho nas próximas notas.
 */

export interface ConfirmedItem {
  productId: string;
  variantId: string | null;
  quantity: number;
  supplierCode: string | null;
  description: string | null;
}

type Result =
  | { ok: true; applied: number; failed: { description: string | null; error: string }[] }
  | { ok: false; error: string };

export async function commitNoteEntries(params: {
  noteReference: string;
  items: ConfirmedItem[];
}): Promise<Result> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sessão expirada. Faça login novamente." };
  const userId = (session.user as { id?: string }).id ?? null;

  const reference = params.noteReference?.trim() || "Nota sem número";
  const items = params.items.filter((i) => i.quantity > 0 && (i.variantId || i.productId));

  if (items.length === 0) return { ok: false, error: "Nenhum item válido para lançar." };

  let applied = 0;
  const failed: { description: string | null; error: string }[] = [];

  for (const item of items) {
    try {
      await applyStockDelta({
        productId: item.productId,
        variantId: item.variantId,
        type: StockMovementType.ENTRADA,
        delta: Math.trunc(item.quantity),
        reason: `Entrada por nota: ${reference}`,
        reference,
        userId,
      });
      applied += 1;

      // aprende o código para as próximas notas
      if (item.supplierCode) {
        const code = item.supplierCode.toUpperCase();
        await prisma.noteItemAlias.upsert({
          where: { supplierCode: code },
          update: {
            productId: item.productId,
            variantId: item.variantId,
            description: item.description,
          },
          create: {
            supplierCode: code,
            productId: item.productId,
            variantId: item.variantId,
            description: item.description,
          },
        });
      }
    } catch (e) {
      failed.push({
        description: item.description,
        error: e instanceof StockError ? e.message : "Erro ao lançar.",
      });
    }
  }

  revalidatePath("/gestao");
  return { ok: true, applied, failed };
}

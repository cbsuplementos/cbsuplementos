"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { applyStockDelta, setStockAbsolute, StockError } from "@/lib/stock";
import { StockMovementType } from "@prisma/client";

/**
 * Server Actions — App de gestão de estoque.
 *
 * "Venda" aqui = dar baixa no estoque com registro no livro-razão
 * (tipo SAIDA_VENDA_APP). Não cria um Order/checkout (isso é do site
 * público, ligado a pagamento). O objetivo é o controle de estoque em
 * tempo real: vendeu no balcão → desce do saldo → some do site.
 */

type Result =
  | { ok: true; stockAfter: number }
  | { ok: false; error: string };

async function currentUserId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user) throw new StockError("Sessão expirada. Faça login novamente.");
  return (session.user as { id?: string }).id ?? null;
}

function handle(e: unknown): Result {
  if (e instanceof StockError) return { ok: false, error: e.message };
  console.error("[gestao/actions]", e);
  return { ok: false, error: "Não foi possível concluir a operação. Tente de novo." };
}

/** Baixa de estoque por venda. */
export async function sellStock(params: {
  productId: string;
  variantId?: string | null;
  quantity: number;
  reference?: string | null;
}): Promise<Result> {
  try {
    const userId = await currentUserId();
    const qty = Math.trunc(Number(params.quantity));
    if (!qty || qty <= 0) return { ok: false, error: "Informe uma quantidade maior que zero." };

    const { stockAfter } = await applyStockDelta({
      productId: params.productId,
      variantId: params.variantId ?? null,
      type: StockMovementType.SAIDA_VENDA_APP,
      delta: -qty,
      reference: params.reference?.trim() || null,
      userId,
    });

    revalidatePath("/gestao");
    revalidatePath(`/gestao/produto/${params.productId}`);
    return { ok: true, stockAfter };
  } catch (e) {
    return handle(e);
  }
}

/** Entrada de estoque (reposição / compra). */
export async function addStock(params: {
  productId: string;
  variantId?: string | null;
  quantity: number;
  reason?: string | null;
}): Promise<Result> {
  try {
    const userId = await currentUserId();
    const qty = Math.trunc(Number(params.quantity));
    if (!qty || qty <= 0) return { ok: false, error: "Informe uma quantidade maior que zero." };

    const { stockAfter } = await applyStockDelta({
      productId: params.productId,
      variantId: params.variantId ?? null,
      type: StockMovementType.ENTRADA,
      delta: qty,
      reason: params.reason?.trim() || null,
      userId,
    });

    revalidatePath("/gestao");
    revalidatePath(`/gestao/produto/${params.productId}`);
    return { ok: true, stockAfter };
  } catch (e) {
    return handle(e);
  }
}

/** Ajuste manual: define o estoque para um valor exato (contagem/correção). */
export async function adjustStock(params: {
  productId: string;
  variantId?: string | null;
  setTo: number;
  reason?: string | null;
}): Promise<Result> {
  try {
    const userId = await currentUserId();
    const setTo = Math.trunc(Number(params.setTo));
    if (setTo < 0 || Number.isNaN(setTo)) return { ok: false, error: "Informe um valor igual ou maior que zero." };

    const { stockAfter } = await setStockAbsolute({
      productId: params.productId,
      variantId: params.variantId ?? null,
      setTo,
      reason: params.reason?.trim() || null,
      userId,
    });

    revalidatePath("/gestao");
    revalidatePath(`/gestao/produto/${params.productId}`);
    return { ok: true, stockAfter };
  } catch (e) {
    return handle(e);
  }
}

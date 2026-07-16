/**
 * backfill-stock-flags.ts (E3) — Carimba stockDebitedAt nos pedidos ANTIGOS.
 *
 * Por quê: até o E3, o webhook baixava o estoque sem registrar quando.
 * O novo controle de baixa/devolução usa dois carimbos no pedido
 * (stockDebitedAt / stockReturnedAt). Pedidos pagos ANTES do E3 já
 * tiveram o estoque baixado, mas estão com o carimbo vazio — sem este
 * backfill, cancelar um deles NÃO devolveria o estoque (o sistema acharia
 * que nunca baixou).
 *
 * O que faz: para todo pedido em status pago (Pago / Em preparação /
 * Saiu para entrega / Entregue) sem stockDebitedAt, grava
 * stockDebitedAt = paidAt (ou updatedAt, se paidAt estiver vazio).
 *
 * O que NÃO faz: pedidos CANCELLED antigos ficam como estão — não dá
 * para saber se o estoque deles foi reposto manualmente. Cancelá-los de
 * novo é no-op, então não há risco.
 *
 * Uso:
 *   npx tsx scripts/backfill-stock-flags.ts            # DRY-RUN
 *   npx tsx scripts/backfill-stock-flags.ts --apply    # grava
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

const PAID_FAMILY = [
  "PAYMENT_APPROVED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
] as const;

async function main() {
  console.log(
    `\n=== Backfill de carimbos de estoque — ${APPLY ? "APLICANDO" : "DRY-RUN (nada será gravado)"} ===\n`
  );

  const orders = await prisma.order.findMany({
    where: {
      status: { in: [...PAID_FAMILY] as never },
      stockDebitedAt: null,
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paidAt: true,
      updatedAt: true,
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (orders.length === 0) {
    console.log("Nenhum pedido pago sem carimbo — nada a fazer. ✅\n");
    await prisma.$disconnect();
    return;
  }

  console.log(`Pedidos pagos sem carimbo: ${orders.length}\n`);
  for (const o of orders) {
    const when = o.paidAt ?? o.updatedAt;
    console.log(
      `  · ${o.orderNumber}  ${o.status.padEnd(17)} ${o._count.items} item(ns)  → stockDebitedAt = ${when.toISOString()}`
    );
  }

  if (!APPLY) {
    console.log(
      "\nDRY-RUN concluído. Para gravar:  npx tsx scripts/backfill-stock-flags.ts --apply\n"
    );
    await prisma.$disconnect();
    return;
  }

  let updated = 0;
  for (const o of orders) {
    await prisma.order.update({
      where: { id: o.id },
      data: { stockDebitedAt: o.paidAt ?? o.updatedAt },
    });
    updated++;
  }
  console.log(`\n✅ ${updated} pedido(s) carimbado(s).\n`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Erro:", e);
  await prisma.$disconnect();
  process.exit(1);
});

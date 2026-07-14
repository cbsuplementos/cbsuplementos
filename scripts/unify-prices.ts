/**
 * unify-prices.ts — Unificação do preço de venda (decisão de 02/07/2026).
 *
 * Contexto: o sistema tinha DOIS campos de preço de venda — `price` (o que o
 * site cobra) e `resalePrice` ("revenda", exibido no app de Gestão). Ficou
 * decidido que são a MESMA coisa. A partir de agora:
 *
 *   - `price` é a ÚNICA fonte de verdade do preço de venda;
 *   - todas as telas (site, admin, /gestao) leem `price`;
 *   - o app grava `resalePrice = price` como espelho a cada salvamento
 *     (compatibilidade com qualquer leitura legada).
 *
 * O que este script faz:
 *   1. VERIFICA divergências (linhas onde price ≠ resalePrice, ambos
 *      preenchidos) e as lista — para você conferir a olho. Nota: a
 *      importação do catálogo já gravou `price` a partir da coluna de
 *      revenda da planilha, então o esperado é ZERO divergências.
 *      Em caso de divergência, `price` vence (é o que o site cobra).
 *   2. NORMALIZA o espelho: onde resalePrice é nulo ou diferente,
 *      grava resalePrice = price (produtos e variações).
 *
 * Seguro e idempotente: rodar duas vezes não muda nada na segunda.
 * Nenhum `price` é alterado — o script só escreve em `resalePrice`.
 *
 * Uso:
 *   npx tsx scripts/unify-prices.ts            # DRY-RUN (só relata, não grava)
 *   npx tsx scripts/unify-prices.ts --apply    # grava as normalizações
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const APPLY = process.argv.includes("--apply");

const cents = (v: unknown): number | null => {
  if (v == null) return null;
  const n = Number(String(v));
  return Number.isFinite(n) ? Math.round(n * 100) : null;
};

const brl = (v: unknown): string =>
  v == null
    ? "—"
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
        Number(String(v))
      );

interface Row {
  kind: "produto" | "variação";
  id: string;
  label: string;
  price: unknown;
  resalePrice: unknown;
}

async function main() {
  console.log(
    `\n=== Unificação de preço de venda — ${APPLY ? "APLICANDO" : "DRY-RUN (nada será gravado)"} ===\n`
  );

  const [products, variants] = await Promise.all([
    prisma.product.findMany({
      select: { id: true, name: true, price: true, resalePrice: true },
    }),
    prisma.variant.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        resalePrice: true,
        product: { select: { name: true } },
      },
    }),
  ]);

  const rows: Row[] = [
    ...products.map((p) => ({
      kind: "produto" as const,
      id: p.id,
      label: p.name,
      price: p.price,
      resalePrice: p.resalePrice,
    })),
    ...variants.map((v) => ({
      kind: "variação" as const,
      id: v.id,
      label: `${v.product.name} · ${v.name}`,
      price: v.price,
      resalePrice: v.resalePrice,
    })),
  ];

  const diverging = rows.filter((r) => {
    const a = cents(r.price);
    const b = cents(r.resalePrice);
    return a != null && b != null && a !== b;
  });
  const toMirror = rows.filter((r) => {
    const a = cents(r.price);
    const b = cents(r.resalePrice);
    return a != null && (b == null || b !== a);
  });
  const alreadyOk = rows.length - toMirror.length;

  console.log(`Linhas analisadas ....... ${rows.length} (${products.length} produtos + ${variants.length} variações)`);
  console.log(`Já espelhadas ........... ${alreadyOk}`);
  console.log(`Espelho a gravar ........ ${toMirror.length} (resalePrice ← price)`);
  console.log(`Divergências reais ...... ${diverging.length} (price ≠ resalePrice, ambos preenchidos)\n`);

  if (diverging.length > 0) {
    console.log("⚠️  Divergências encontradas — `price` (site) prevalece. Confira:");
    for (const r of diverging.slice(0, 30)) {
      console.log(
        `   [${r.kind}] ${r.label}\n` +
          `      price (site): ${brl(r.price)}   ×   resalePrice (antigo): ${brl(r.resalePrice)}`
      );
    }
    if (diverging.length > 30) {
      console.log(`   ... e mais ${diverging.length - 30}.`);
    }
    console.log("");
  }

  if (!APPLY) {
    console.log("DRY-RUN concluído. Nada foi gravado.");
    console.log("Para aplicar:  npx tsx scripts/unify-prices.ts --apply\n");
    return;
  }

  let updated = 0;
  for (const r of toMirror) {
    if (r.kind === "produto") {
      await prisma.product.update({
        where: { id: r.id },
        data: { resalePrice: r.price as never },
      });
    } else {
      await prisma.variant.update({
        where: { id: r.id },
        data: { resalePrice: r.price as never },
      });
    }
    updated++;
    if (updated % 100 === 0) console.log(`   ... ${updated}/${toMirror.length}`);
  }

  console.log(`\n✅ Concluído: ${updated} espelhos gravados (resalePrice = price).`);
  console.log("Rodar de novo deve reportar 0 a gravar (idempotente).\n");
}

main()
  .catch((e) => {
    console.error("Erro:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

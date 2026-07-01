/**
 * import-catalog.ts — Importa a tabela da distribuidora (.xlsx) para o banco.
 *
 * Modelo (Opção B): cada nome-base vira um Product (pai). Se o nome aparece
 * em 2+ linhas, cada linha vira um Variant (com sabor/apresentação em
 * `attributes` e custo/revenda próprios). Se aparece em 1 linha, vira um
 * produto simples (custo/revenda/estoque no próprio Product, sem variante).
 *
 * Regras de segurança da importação:
 *  - Produtos entram como active:false (NÃO aparecem no site público até você
 *    ativar manualmente — eles ainda não têm imagem nem categoria real).
 *  - Estoque começa em 0 (a planilha não tem quantidade confiável; a contagem
 *    inicial é feita depois pelo app de gestão).
 *  - Categoria = "A classificar" (você reclassifica depois no app).
 *  - Marca fica vazia (você atribui depois, junto com as imagens).
 *  - price público inicial = menor preço de revenda (SUGERIDO) do grupo.
 *
 * Uso:
 *   npx tsx scripts/import-catalog.ts <caminho-da-planilha.xlsx>            # DRY-RUN (não grava nada)
 *   npx tsx scripts/import-catalog.ts <caminho-da-planilha.xlsx> --commit  # grava no banco
 *
 * Requer: npm i -D xlsx tsx
 */

import * as XLSX from "xlsx";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// ---------- normalização (idêntica à prévia) ----------
const clean = (s: unknown): string =>
  s == null ? "" : String(s).replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();

const isNum = (x: unknown): boolean => {
  if (typeof x === "number") return Number.isFinite(x);
  if (x == null) return false;
  const n = Number(String(x).replace(",", "."));
  return Number.isFinite(n);
};

const num = (x: unknown): number => Number(String(x).replace(",", "."));

const money = (n: number): string => n.toFixed(2);

const slugify = (s: string): string => {
  const base = s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return base || "produto";
};

const SKIP_PREFIXES = ["CLIENTE", "CIDADE", "ENDER", "BAIRRO", "OBS", "*", "TABELA"];

// ---------- tipos ----------
interface Row {
  name: string;
  sabor: string;
  apres: string;
  custo: number;
  revenda: number | null;
}

function variantName(r: Row): string {
  const parts = [r.sabor, r.apres].filter(Boolean);
  return parts.length ? parts.join(" · ") : "Padrão";
}

function variantAttributes(r: Row): Prisma.InputJsonValue | undefined {
  const attrs: Record<string, string> = {};
  if (r.sabor) attrs["Sabor"] = r.sabor;
  if (r.apres) attrs["Apresentação"] = r.apres;
  return Object.keys(attrs).length ? attrs : undefined;
}

// ---------- leitura da planilha ----------
function readRows(path: string): Row[] {
  const wb = XLSX.readFile(path);
  const ws = wb.Sheets["TABELA"] ?? wb.Sheets[wb.SheetNames[0]];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    raw: true,
    defval: null,
  });

  const rows: Row[] = [];
  for (const r of raw) {
    const name = clean(r[0]);
    if (name === "" || name === "PRODUTOS") continue;
    if (SKIP_PREFIXES.some((p) => name.toUpperCase().startsWith(p))) continue;
    if (!isNum(r[5])) continue; // sem VL COMPRA numérico → não é produto
    rows.push({
      name,
      sabor: clean(r[1]),
      apres: clean(r[2]),
      custo: num(r[5]),
      revenda: isNum(r[6]) ? num(r[6]) : null,
    });
  }
  return rows;
}

// ---------- agrupamento ----------
function group(rows: Row[]): Map<string, Row[]> {
  const g = new Map<string, Row[]>();
  for (const r of rows) {
    const k = r.name.toUpperCase();
    (g.get(k) ?? g.set(k, []).get(k)!).push(r);
  }
  return g;
}

async function main() {
  const [, , filePath, flag] = process.argv;
  const COMMIT = flag === "--commit";

  if (!filePath) {
    console.error("Uso: npx tsx scripts/import-catalog.ts <planilha.xlsx> [--commit]");
    process.exit(1);
  }

  const rows = readRows(filePath);
  const groups = group(rows);

  const simple = [...groups.values()].filter((v) => v.length === 1).length;
  const multi = groups.size - simple;
  const variantCount = [...groups.values()]
    .filter((v) => v.length > 1)
    .reduce((a, v) => a + v.length, 0);

  console.log("──────────────────────────────────────────────");
  console.log(`  Modo:              ${COMMIT ? "COMMIT (grava no banco)" : "DRY-RUN (nada é gravado)"}`);
  console.log(`  Linhas úteis:      ${rows.length}`);
  console.log(`  Produtos-pai:      ${groups.size}`);
  console.log(`    · simples:       ${simple}`);
  console.log(`    · com variantes: ${multi}`);
  console.log(`  Variantes:         ${variantCount}`);
  console.log("──────────────────────────────────────────────");

  if (!COMMIT) {
    // Amostra pra conferência visual
    let shown = 0;
    for (const [, items] of groups) {
      if (items.length > 1 && shown < 5) {
        console.log(`\n  ${items[0].name}  (${items.length} variantes)`);
        for (const it of items.slice(0, 6))
          console.log(`     - ${variantName(it)}  | custo R$${money(it.custo)}  revenda R$${it.revenda != null ? money(it.revenda) : "—"}`);
        shown++;
      }
    }
    console.log("\n  Dry-run concluído. Reveja e rode com --commit para gravar.");
    await prisma.$disconnect();
    return;
  }

  // ---------- COMMIT ----------
  const category = await prisma.category.upsert({
    where: { slug: "a-classificar" },
    update: {},
    create: { name: "A classificar", slug: "a-classificar", active: true, order: 999 },
  });

  // idempotência: pular produtos que já existem (por nome)
  const existingNames = new Set(
    (await prisma.product.findMany({ select: { name: true } })).map((p) => p.name)
  );
  const usedSlugs = new Set(
    (await prisma.product.findMany({ select: { slug: true } })).map((p) => p.slug)
  );

  const uniqueSlug = (name: string): string => {
    const base = slugify(name);
    let s = base;
    let i = 2;
    while (usedSlugs.has(s)) s = `${base}-${i++}`;
    usedSlugs.add(s);
    return s;
  };

  let created = 0;
  let skipped = 0;
  let createdVariants = 0;

  for (const [, items] of groups) {
    const name = items[0].name;
    if (existingNames.has(name)) {
      skipped++;
      continue;
    }

    const isMulti = items.length > 1;
    const resales = items.map((i) => i.revenda).filter((v): v is number => v != null);
    const publicPrice = resales.length ? Math.min(...resales) : items[0].custo;

    if (isMulti) {
      // desambiguar variantes com nome repetido dentro do mesmo pai
      const seen = new Map<string, number>();
      const variantData = items.map((it) => {
        let vn = variantName(it);
        const c = seen.get(vn) ?? 0;
        seen.set(vn, c + 1);
        if (c > 0) vn = `${vn} (${c + 1})`;
        return {
          name: vn,
          price: money(it.revenda ?? it.custo),
          costPrice: money(it.custo),
          resalePrice: it.revenda != null ? money(it.revenda) : null,
          stock: 0,
          attributes: variantAttributes(it),
          active: true,
        };
      });

      await prisma.product.create({
        data: {
          name,
          slug: uniqueSlug(name),
          description: "",
          price: money(publicPrice),
          mainImage: "",
          categoryId: category.id,
          active: false,
          stock: null,
          variants: { create: variantData },
        },
      });
      createdVariants += variantData.length;
    } else {
      const it = items[0];
      await prisma.product.create({
        data: {
          name,
          slug: uniqueSlug(name),
          description: "",
          price: money(it.revenda ?? it.custo),
          mainImage: "",
          categoryId: category.id,
          active: false,
          stock: 0,
          costPrice: money(it.custo),
          resalePrice: it.revenda != null ? money(it.revenda) : null,
        },
      });
    }
    created++;
    existingNames.add(name);
  }

  console.log(`\n  ✔ Produtos criados:  ${created}`);
  console.log(`  ✔ Variantes criadas: ${createdVariants}`);
  console.log(`  ↷ Pulados (já existiam): ${skipped}`);
  console.log(`  Categoria usada: "${category.name}" (id ${category.id})`);
  console.log(`\n  Todos entraram como INATIVOS (active:false). Ative no admin quando`);
  console.log(`  tiverem imagem, marca e categoria definidas.`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

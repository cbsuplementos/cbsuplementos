/**
 * populate-brands.ts — Popula a tabela Brand e vincula os produtos (E1).
 *
 * Como funciona:
 *   A planilha da SBR é organizada em SEÇÕES por marca, mas o nome da marca
 *   é um LOGO (imagem), não texto. Os logos foram extraídos e identificados
 *   um a um (leitura visual + OCR + confronto com os nomes dos produtos de
 *   cada seção — ex.: "CREATINA MAX TITANIUM" confirma a seção Max Titanium).
 *   O resultado é a tabela SECTION_BRANDS abaixo: intervalo de linhas da
 *   planilha → marca. Para corrigir qualquer identificação, basta editar o
 *   nome aqui e rodar de novo.
 *
 * O que o script faz:
 *   1. Lê a planilha com O MESMO parser/agrupamento do import-catalog.ts
 *      (garante que os nomes batem com os produtos criados na importação).
 *   2. Atribui a marca de cada linha pela seção; agrupa por produto-pai.
 *   3. Grupos com marcas CONFLITANTES (mesmo nome de produto em seções de
 *      marcas diferentes — ex.: "CREATINA 100% PURA") ficam SEM marca e são
 *      listados para decisão manual.
 *   4. Cria as marcas (upsert por slug) e grava product.brandId.
 *
 * Seguro e idempotente:
 *   - NÃO altera preço, estoque, nome ou qualquer outro campo.
 *   - Produto que JÁ tem marca no banco não é sobrescrito (a menos que
 *     rode com --force).
 *
 * Uso:
 *   npx tsx scripts/populate-brands.ts <planilha.xlsx>            # DRY-RUN
 *   npx tsx scripts/populate-brands.ts <planilha.xlsx> --apply    # grava
 *   npx tsx scripts/populate-brands.ts <planilha.xlsx> --apply --force
 */

import * as XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const APPLY = process.argv.includes("--apply");
const FORCE = process.argv.includes("--force");

/* ================================================================
 * MAPA DE SEÇÕES → MARCA (linha da planilha onde a seção começa)
 * ----------------------------------------------------------------
 * brand: null  = logo ilegível → produtos ficam sem marca e são
 *                listados no relatório para você nomear.
 * Confiança: ✓✓ alta (produto confirma) · ✓ boa (logo legível) ·
 *            ? média (confirme no /admin/marcas depois)
 * ================================================================ */
const SECTION_BRANDS: { fromRow: number; brand: string | null; note: string }[] = [
  { fromRow: 1,   brand: null,                    note: "cabeçalho da tabela (sem produtos)" },
  { fromRow: 14,  brand: "Under Labz",            note: "✓✓ Clembuterunder / Warzone / Creatine Under Labz" },
  { fromRow: 71,  brand: "Body Action",           note: "? logo lido visualmente — Double Force / Essencial-9" },
  { fromRow: 169, brand: "Herbamed",              note: "✓ OCR do logo — vitaminas/colágenos" },
  { fromRow: 202, brand: "FTW",                   note: "? logo lido visualmente — Thermo Crazy / Delicious Whey" },
  { fromRow: 244, brand: "XLab Extreme Nutrition", note: "? logo parcialmente legível — Beta Alanina pura" },
  { fromRow: 254, brand: "Soldiers Nutrition",    note: "? logo lido visualmente — Creatina/Beta Alanina puras" },
  { fromRow: 268, brand: "Health Labs",           note: "✓✓ nome aparece nos próprios produtos" },
  { fromRow: 311, brand: "Demons Lab",            note: "✓✓ OCR + linha Hell Sinner/Diabolik/Insane" },
  { fromRow: 351, brand: "Nutrata",               note: "✓✓ 'Barra proteica Nutrata' / Grego Bar" },
  { fromRow: 388, brand: "Lassany",               note: "✓ produto 'Dilassany' confirma" },
  { fromRow: 412, brand: "Vitafor",               note: "✓✓ Isofort / Omegafor / Creafort" },
  { fromRow: 438, brand: "Black Skull",           note: "✓✓ OCR + Whey 100% HD / BCAA 2400" },
  { fromRow: 477, brand: "Integralmedica",        note: "✓✓ OCR + linha Darkness / Carnibol" },
  { fromRow: 533, brand: null,                    note: "⚠ LOGO ILEGÍVEL ('...Nutrition Lab') — Creapure/Q10/Fish Oil/Super Cut" },
  { fromRow: 562, brand: "União Vegetal",         note: "? OCR do logo — Morotim / Morocaf / fitoterápicos" },
  { fromRow: 578, brand: "Bold Snacks",           note: "✓✓ Bold Bar / Bold Tube" },
  { fromRow: 615, brand: "Ganexa",                note: "? seção mista de alimentos (fotos Ganexa); confira itens" },
  { fromRow: 651, brand: "Melius",                note: "✓✓ texto na planilha: 'MELIUS - EVOLUTION NUTRITION'" },
  { fromRow: 667, brand: "Health Nutrition",      note: "✓✓ texto na planilha: 'HEALTH NUTRITON'" },
  { fromRow: 720, brand: "Max Titanium",          note: "✓✓ Creatina Max Titanium / Mass Titanium / Horus" },
  { fromRow: 808, brand: "Adaptogen",             note: "✓✓ Tasty Whey / Panic / Dila Pump" },
  { fromRow: 881, brand: "Probiótica",            note: "✓✓ Creatina Pura Probiótica / Massa Nitro" },
  { fromRow: 921, brand: "Mrs Taste",             note: "✓✓ nomes confirmam: molhos/caldas 'MRS TASTE', spreads, Taste Cookie Bar" },
];

/** Produto cujo NOME cita a marca sobrepõe a seção (ex.: Pantastica). */
const NAME_OVERRIDES: { test: RegExp; brand: string }[] = [
  { test: /INTEGRAL\s*MEDICA/i, brand: "Integralmedica" },
  { test: /MAX\s*TITANIUM/i, brand: "Max Titanium" },
  { test: /UNDER\s*LABZ/i, brand: "Under Labz" },
  { test: /HEALTH\s*LABS/i, brand: "Health Labs" },
  { test: /PROBI[OÓ]TICA/i, brand: "Probiótica" },
  { test: /MRS\s*TASTE/i, brand: "Mrs Taste" },
];

/* ---------- normalização (idêntica ao import-catalog.ts) ---------- */
const clean = (s: unknown): string =>
  s == null ? "" : String(s).replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();

const isNum = (x: unknown): boolean => {
  if (typeof x === "number") return Number.isFinite(x);
  if (x == null) return false;
  const n = Number(String(x).replace(",", "."));
  return Number.isFinite(n);
};

const slugify = (s: string): string => {
  const base = s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return base || "marca";
};

const SKIP_PREFIXES = ["CLIENTE", "CIDADE", "ENDER", "BAIRRO", "OBS", "*", "TABELA"];

function brandForRow(rowNumber: number, name: string): string | null {
  for (const o of NAME_OVERRIDES) if (o.test.test(name)) return o.brand;
  let current: string | null = null;
  for (const s of SECTION_BRANDS) {
    if (rowNumber >= s.fromRow) current = s.brand;
    else break;
  }
  return current;
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath || filePath.startsWith("--")) {
    console.error(
      "Uso: npx tsx scripts/populate-brands.ts <planilha.xlsx> [--apply] [--force]"
    );
    process.exit(1);
  }

  console.log(
    `\n=== Marcas (E1) — ${APPLY ? "APLICANDO" : "DRY-RUN (nada será gravado)"}${FORCE ? " +force" : ""} ===\n`
  );

  /* ---------- 1. lê a planilha com o mesmo filtro do import ---------- */
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets["TABELA"] ?? wb.Sheets[wb.SheetNames[0]];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    raw: true,
    defval: null,
  });

  // agrupa por produto-pai (chave = nome limpo em CAIXA ALTA, como o import)
  const groups = new Map<string, { name: string; brands: Set<string | null> }>();
  for (let i = 0; i < raw.length; i++) {
    const r = raw[i];
    const rowNumber = i + 1; // linha real da planilha
    const name = clean(r?.[0]);
    if (name === "" || name === "PRODUTOS") continue;
    if (SKIP_PREFIXES.some((p) => name.toUpperCase().startsWith(p))) continue;
    if (!isNum(r?.[5])) continue; // sem VL COMPRA numérico → não é produto

    const key = name.toUpperCase();
    const g = groups.get(key) ?? { name, brands: new Set<string | null>() };
    g.brands.add(brandForRow(rowNumber, name));
    groups.set(key, g);
  }

  /* ---------- 2. resolve a marca de cada produto-pai ---------- */
  const decided = new Map<string, string | null>(); // key → brand name | null
  const conflicts: { name: string; brands: (string | null)[] }[] = [];
  const unbrandedSections: string[] = [];

  for (const [key, g] of groups) {
    const named = [...g.brands].filter((b): b is string => b !== null);
    const distinct = [...new Set(named)];
    if (distinct.length === 1 && g.brands.size === distinct.length) {
      decided.set(key, distinct[0]);
    } else if (distinct.length === 0) {
      decided.set(key, null);
      unbrandedSections.push(g.name);
    } else if (distinct.length === 1) {
      // mistura de marca definida + seção sem marca → usa a definida
      decided.set(key, distinct[0]);
    } else {
      decided.set(key, null);
      conflicts.push({ name: g.name, brands: [...g.brands] });
    }
  }

  /* ---------- 3. casa com os produtos do banco ---------- */
  const dbProducts = await prisma.product.findMany({
    select: { id: true, name: true, brandId: true, brand: { select: { name: true } } },
  });
  const dbByKey = new Map(dbProducts.map((p) => [clean(p.name).toUpperCase(), p]));

  type Plan = { productId: string; productName: string; brand: string };
  const plan: Plan[] = [];
  const alreadyBranded: string[] = [];
  const unmatchedSheet: string[] = [];

  for (const [key, brand] of decided) {
    if (!brand) continue;
    const db = dbByKey.get(key);
    if (!db) {
      unmatchedSheet.push(groups.get(key)!.name);
      continue;
    }
    if (db.brandId && !FORCE) {
      alreadyBranded.push(`${db.name} (já: ${db.brand?.name ?? "?"})`);
      continue;
    }
    plan.push({ productId: db.id, productName: db.name, brand });
  }

  /* ---------- 4. relatório ---------- */
  const byBrand = new Map<string, string[]>();
  for (const p of plan) {
    (byBrand.get(p.brand) ?? byBrand.set(p.brand, []).get(p.brand)!).push(p.productName);
  }

  console.log(`Produtos-pai na planilha .......... ${groups.size}`);
  console.log(`Com marca identificada ............ ${[...decided.values()].filter(Boolean).length}`);
  console.log(`A vincular no banco ............... ${plan.length}`);
  console.log(`Já tinham marca (pulados) ......... ${alreadyBranded.length}${FORCE ? " (--force: 0 pulados)" : ""}`);
  console.log(`Sem marca (seção de logo ilegível)  ${unbrandedSections.length}`);
  console.log(`CONFLITOS (marcas diferentes) ..... ${conflicts.length}`);
  console.log(`Na planilha mas não no banco ...... ${unmatchedSheet.length}\n`);

  console.log("── Marcas e quantidade de produtos ──");
  for (const [b, items] of [...byBrand.entries()].sort((a, c) => c[1].length - a[1].length)) {
    console.log(`  ${b.padEnd(24)} ${String(items.length).padStart(3)}  ex.: ${items.slice(0, 2).join(" · ").slice(0, 60)}`);
  }

  if (conflicts.length) {
    console.log("\n⚠ CONFLITOS — mesmo nome em seções de marcas diferentes (ficam SEM marca; decida no admin):");
    for (const c of conflicts.slice(0, 20))
      console.log(`  · ${c.name}  [${c.brands.map((b) => b ?? "?").join(" vs ")}]`);
  }
  if (unbrandedSections.length) {
    console.log("\n⚠ SEM MARCA — seções de logo ilegível (linhas 533 e 921; nomeie e edite SECTION_BRANDS):");
    for (const n of unbrandedSections.slice(0, 25)) console.log(`  · ${n}`);
    if (unbrandedSections.length > 25) console.log(`  ... e mais ${unbrandedSections.length - 25}.`);
  }
  if (unmatchedSheet.length) {
    console.log("\nℹ Não encontrados no banco (nomes divergentes ou não importados):");
    for (const n of unmatchedSheet.slice(0, 15)) console.log(`  · ${n}`);
  }

  if (!APPLY) {
    console.log("\nDRY-RUN concluído. Nada foi gravado.");
    console.log("Para aplicar:  npx tsx scripts/populate-brands.ts <planilha.xlsx> --apply\n");
    await prisma.$disconnect();
    return;
  }

  /* ---------- 5. grava ---------- */
  const brandIds = new Map<string, string>();
  for (const brandName of byBrand.keys()) {
    const slug = slugify(brandName);
    const b = await prisma.brand.upsert({
      where: { slug },
      update: { name: brandName },
      create: { name: brandName, slug },
    });
    brandIds.set(brandName, b.id);
  }
  console.log(`\n✅ ${brandIds.size} marcas criadas/atualizadas.`);

  let linked = 0;
  for (const p of plan) {
    await prisma.product.update({
      where: { id: p.productId },
      data: { brandId: brandIds.get(p.brand)! },
    });
    linked++;
    if (linked % 50 === 0) console.log(`   ... ${linked}/${plan.length}`);
  }
  console.log(`✅ ${linked} produtos vinculados às suas marcas.\n`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Erro:", e);
  await prisma.$disconnect();
  process.exit(1);
});

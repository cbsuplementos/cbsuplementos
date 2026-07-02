/**
 * lib/note-match.ts — Casa um item lido da nota com o catálogo.
 *
 * Prioridade:
 *  1. Código do fornecedor via tabela de equivalências (exato, confiança total).
 *  2. Similaridade textual da descrição contra nome+variante+marca.
 *
 * Puro e sem dependências de servidor: roda no cliente durante a revisão.
 */

export interface CatalogEntry {
  productId: string;
  variantId: string | null;
  label: string; // "Produto — Variante"
  tokens: string[]; // tokens normalizados para busca
  brand: string | null;
}

export interface MatchCandidate {
  entry: CatalogEntry;
  score: number; // 0..1
}

export interface MatchResult {
  best: CatalogEntry | null;
  score: number;
  confidence: "high" | "medium" | "none";
  candidates: MatchCandidate[];
  viaCode: boolean;
}

const STOPWORDS = new Set([
  "de", "da", "do", "com", "sem", "e", "un", "refil", "pote", "kg", "g", "ml",
  "caps", "the", "c",
]);

export function tokenize(s: string): string[] {
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9%.]+/g, " ")
    .split(/\s+/)
    .map((t) => t.replace(/^\.+|\.+$/g, ""))
    .filter((t) => t.length > 0 && !STOPWORDS.has(t));
}

/** Similaridade por sobreposição de tokens (Dice ponderado). */
function similarity(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  let hits = 0;
  for (const t of new Set(a)) {
    if (setB.has(t)) hits += 1;
    // dígitos/tamanhos valem mais (2.1kg, 100%, 300, 90)
  }
  const uniqA = new Set(a).size;
  const uniqB = setB.size;
  return (2 * hits) / (uniqA + uniqB);
}

export function buildCatalogEntry(
  productId: string,
  variantId: string | null,
  productName: string,
  variantName: string | null,
  attributes: Record<string, unknown> | null,
  brand: string | null
): CatalogEntry {
  const attrText = attributes
    ? Object.values(attributes).map((v) => String(v)).join(" ")
    : "";
  const label = variantName ? `${productName} — ${variantName}` : productName;
  const searchText = [productName, variantName ?? "", attrText, brand ?? ""].join(" ");
  return {
    productId,
    variantId,
    label,
    tokens: tokenize(searchText),
    brand,
  };
}

export function matchItem(
  description: string,
  supplierCode: string | null,
  catalog: CatalogEntry[],
  aliasByCode: Map<string, { productId: string; variantId: string | null }>
): MatchResult {
  // 1) casamento exato por código
  if (supplierCode) {
    const alias = aliasByCode.get(supplierCode.toUpperCase());
    if (alias) {
      const entry = catalog.find(
        (e) => e.productId === alias.productId && e.variantId === (alias.variantId ?? null)
      );
      if (entry) {
        return { best: entry, score: 1, confidence: "high", candidates: [{ entry, score: 1 }], viaCode: true };
      }
    }
  }

  // 2) similaridade textual
  const q = tokenize(description);
  const scored: MatchCandidate[] = catalog
    .map((entry) => ({ entry, score: similarity(q, entry.tokens) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const best = scored[0];
  if (!best || best.score < 0.28) {
    return { best: null, score: best?.score ?? 0, confidence: "none", candidates: scored, viaCode: false };
  }

  const confidence: MatchResult["confidence"] = best.score >= 0.6 ? "high" : "medium";
  return { best: best.entry, score: best.score, confidence, candidates: scored, viaCode: false };
}

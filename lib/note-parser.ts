/**
 * lib/note-parser.ts — Extrai itens estruturados do texto cru do OCR.
 *
 * Estratégia central (validada na nota real):
 *  - A coluna de QUANTIDADE do OCR é pouco confiável: "3,00" costuma ser
 *    lido como "300" (a vírgula some). NÃO confiar nela.
 *  - Os dois valores monetários (V.UNIT e V.TOTAL) saem confiáveis.
 *    A quantidade real = round(V.TOTAL / V.UNIT). Isso contorna o campo
 *    mais perigoso. Ex.: 411 / 137 = 3.
 *  - O código do fornecedor (11154, 1W20002, 846…), quando existe, é a
 *    chave de casamento mais estável.
 *
 * O resultado é sempre revisável pelo humano — este parser dá o melhor
 * palpite, não a palavra final.
 */

export interface ParsedNoteItem {
  raw: string;
  code: string | null;
  description: string;
  unitValue: number | null;
  totalValue: number | null;
  qtyFromRatio: number | null; // total / unit (fonte primária)
  qtyFromColumn: number | null; // leitura direta da coluna (secundária)
  isCombo: boolean;
}

/** Converte um token monetário do OCR em número, tolerando vírgula perdida. */
export function parseBRL(token: string): number | null {
  const digits = token.replace(/[^\d]/g, "");
  if (!digits) return null;
  // BRL sempre tem centavos: os 2 últimos dígitos são os centavos.
  return parseInt(digits, 10) / 100;
}

const HEADER_HINTS = [
  "DADOS DO PEDIDO",
  "DESCRICAO",
  "DESCRIÇÃO",
  "TAMANHO",
  "V. UNIT",
  "V.UNIT",
  "V. TOTAL",
];

function looksLikeHeader(line: string): boolean {
  const up = line.toUpperCase();
  return HEADER_HINTS.some((h) => up.includes(h)) && !/R\$/.test(line);
}

/** Extrai o código do fornecedor no início da linha, se houver. */
function extractCode(line: string): { code: string | null; rest: string } {
  // remove marcador de item circulado tipo "(4)", "4.", "K 12."
  let s = line.replace(/^[\s(]*[✗✓xXкK]?\s*\d{1,2}[.)]\s*/, "").replace(/^[()\s]+/, "");
  // código: começa com dígito, 3+ chars, pode ter um "W" no meio, seguido de "-"
  const m = s.match(/^([0-9][0-9A-Z]{2,})\s*[-–]\s*/);
  if (m) {
    return { code: m[1].toUpperCase(), rest: s.slice(m[0].length) };
  }
  return { code: null, rest: s };
}

/** Extrai todos os valores após "R$" na linha. */
function extractMoney(line: string): number[] {
  const out: number[] = [];
  const re = /R\$\s?([\d.]+(?:,\d{2})?)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    const v = parseBRL(m[1]);
    if (v != null && v > 0) out.push(v);
  }
  return out;
}

/** Tenta ler a quantidade da coluna (ex.: "3,00", "10,00", "300"). */
function extractColumnQty(afterDesc: string): number | null {
  // procura um número seguido eventualmente de ",00" antes de "UN"/NCM/R$
  const m = afterDesc.match(/(\d{1,3})(?:[.,]\d{2})?\s*(?:UN|un|$|\s)/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}

/** Limpa a descrição removendo NCM, coluna de qtd e ruído, mas preservando
 *  números que fazem parte do nome (100%, 2.1KG, 30 CAPS, 500G). */
function cleanDescription(rest: string): string {
  let d = rest.split(/R\$/)[0]; // corta nos valores
  d = d.replace(/\b\d{8}\b/g, " "); // NCM
  // remove anotações à mão após seta
  d = d.replace(/[—→>].*/g, " ");
  // remove a coluna de quantidade no fim: "3,00", "300", "10,00" (+ UN + 2 letras de ruído)
  d = d.replace(/\s+\d{1,3}(?:[.,]\d{2})?\s*(?:UN|un|uN)?\s*[A-Za-zÀ-ú]{0,2}\s*$/, " ");
  // remove marcador de item circulado no início: "OD)", "q)", "O)", "(E)", "Yo .", "K", "À"
  d = d.replace(/^\s*[(]?[A-Za-zÀ-ú]{0,3}[).]\s*/, " ");
  d = d.replace(/^\s*[A-Za-zÀ-ú]{1,2}\s+(?=\d|100|[A-ZÀ-Ú]{3,})/, " ");
  return d.replace(/\s+/g, " ").trim();
}

export function parseNoteText(rawText: string): ParsedNoteItem[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const items: ParsedNoteItem[] = [];

  for (const line of lines) {
    if (looksLikeHeader(line)) continue;

    const money = extractMoney(line);
    // uma linha de item precisa de pelo menos um valor monetário
    if (money.length === 0) continue;

    const { code, rest } = extractCode(line);

    // V.UNIT e V.TOTAL = os dois últimos valores (unit antes de total)
    let unitValue: number | null = null;
    let totalValue: number | null = null;
    if (money.length >= 2) {
      unitValue = money[money.length - 2];
      totalValue = money[money.length - 1];
    } else {
      totalValue = money[money.length - 1];
    }

    let qtyFromRatio: number | null = null;
    if (unitValue && totalValue && unitValue > 0) {
      const r = totalValue / unitValue;
      const rounded = Math.round(r);
      // só aceita se a razão for próxima de um inteiro (tolerância p/ centavos)
      if (rounded >= 1 && Math.abs(r - rounded) <= 0.06) qtyFromRatio = rounded;
    }

    const description = cleanDescription(rest);
    const qtyFromColumn = extractColumnQty(rest.split(/R\$/)[0].slice(description.length));
    const isCombo = /\bCOMBO\b/i.test(description) || /\bCOMBO\b/i.test(line);

    // descarta linha sem descrição aproveitável
    if (description.replace(/[^A-Za-z]/g, "").length < 3) continue;

    items.push({
      raw: line,
      code,
      description,
      unitValue,
      totalValue,
      qtyFromRatio,
      qtyFromColumn,
      isCombo,
    });
  }

  return items;
}

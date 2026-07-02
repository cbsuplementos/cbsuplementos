"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { parseNoteText } from "@/lib/note-parser";
import {
  matchItem,
  tokenize,
  type CatalogEntry,
  type MatchResult,
} from "@/lib/note-match";
import { commitNoteEntries, type ConfirmedItem } from "./actions";

type Alias = { supplierCode: string; productId: string; variantId: string | null };

interface Row {
  key: string;
  code: string | null;
  description: string;
  qty: string;
  qtyDerived: number | null;
  isCombo: boolean;
  match: MatchResult;
  chosen: CatalogEntry | null;
  skip: boolean;
}

type Phase = "idle" | "reading" | "review" | "saving" | "done";

export function NoteEntry({
  catalog,
  aliases,
}: {
  catalog: CatalogEntry[];
  aliases: Alias[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [noteRef, setNoteRef] = useState("");
  const [result, setResult] = useState<{ applied: number; failed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const aliasByCode = useMemo(() => {
    const m = new Map<string, { productId: string; variantId: string | null }>();
    for (const a of aliases) m.set(a.supplierCode.toUpperCase(), { productId: a.productId, variantId: a.variantId });
    return m;
  }, [aliases]);

  async function handleFile(file: File) {
    setError(null);
    setPhase("reading");
    setProgress(0);
    try {
      const dataUrl = await preprocess(file);
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("por", 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") setProgress(Math.round(m.progress * 100));
        },
      });
      const { data } = await worker.recognize(dataUrl);
      await worker.terminate();

      const parsed = parseNoteText(data.text);
      const newRows: Row[] = parsed.map((it, i) => {
        const match = matchItem(it.description, it.code, catalog, aliasByCode);
        return {
          key: `r${i}`,
          code: it.code,
          description: it.description,
          qty: it.qtyFromRatio != null ? String(it.qtyFromRatio) : "",
          qtyDerived: it.qtyFromRatio,
          isCombo: it.isCombo,
          match,
          chosen: it.isCombo ? null : match.best,
          skip: it.isCombo || match.confidence === "none",
        };
      });
      setRows(newRows);
      setPhase("review");
    } catch (e) {
      console.error(e);
      setError("Não consegui ler a nota. Tente uma foto mais nítida e plana.");
      setPhase("idle");
    }
  }

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  async function confirm() {
    setPhase("saving");
    setError(null);
    const items: ConfirmedItem[] = rows
      .filter((r) => !r.skip && r.chosen && Number(r.qty) > 0)
      .map((r) => ({
        productId: r.chosen!.productId,
        variantId: r.chosen!.variantId,
        quantity: Math.trunc(Number(r.qty)),
        supplierCode: r.code,
        description: r.description,
      }));

    if (items.length === 0) {
      setError("Nenhum item marcado para lançar. Case ao menos um produto.");
      setPhase("review");
      return;
    }

    const res = await commitNoteEntries({ noteReference: noteRef, items });
    if (res.ok) {
      setResult({ applied: res.applied, failed: res.failed.length });
      setPhase("done");
      router.refresh();
    } else {
      setError(res.error);
      setPhase("review");
    }
  }

  // ---------- render ----------
  if (phase === "done" && result) {
    return (
      <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <p className="font-sans text-lg font-semibold text-white">Entrada concluída</p>
        <p className="mt-1 font-sans text-sm text-cool-gray">
          {result.applied} {result.applied === 1 ? "item lançado" : "itens lançados"} no estoque
          {result.failed > 0 && ` · ${result.failed} com erro`}.
        </p>
        <button
          onClick={() => {
            setRows([]);
            setResult(null);
            setNoteRef("");
            setPhase("idle");
          }}
          className="mt-5 rounded-xl bg-gold px-5 py-3 font-sans text-sm font-semibold text-noir active:scale-95"
        >
          Lançar outra nota
        </button>
      </div>
    );
  }

  if (phase === "idle" || phase === "reading") {
    return (
      <div className="mt-6">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        {phase === "reading" ? (
          <div className="rounded-2xl border border-white/10 bg-charcoal/60 p-8 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
            <p className="font-sans text-sm text-white">Lendo a nota…</p>
            <div className="mx-auto mt-3 h-1.5 w-40 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-gold transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 font-sans text-xs text-cool-gray">{progress}%</p>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-white/15 bg-charcoal/40 p-10 transition active:scale-[0.99] active:bg-charcoal"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-gold">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            </div>
            <div>
              <p className="font-sans text-base font-medium text-white">Fotografar ou enviar a nota</p>
              <p className="mt-1 font-sans text-xs text-cool-gray">
                A leitura acontece no seu aparelho, sem enviar a nota pra fora.
              </p>
            </div>
          </button>
        )}
        {error && (
          <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 font-sans text-sm text-red-300 ring-1 ring-red-500/20">
            {error}
          </p>
        )}
      </div>
    );
  }

  // review
  const willApply = rows.filter((r) => !r.skip && r.chosen && Number(r.qty) > 0).length;

  return (
    <div className="mt-5">
      <input
        type="text"
        value={noteRef}
        onChange={(e) => setNoteRef(e.target.value)}
        placeholder="Número / identificação da nota (ex.: Pedido 1234)"
        className="mb-4 w-full rounded-xl border border-white/10 bg-charcoal px-4 py-3 font-sans text-sm text-white placeholder:text-cool-gray focus:border-gold/50 focus:outline-none"
      />

      <div className="space-y-2">
        {rows.map((r) => (
          <ReviewRow
            key={r.key}
            row={r}
            catalog={catalog}
            onChange={(patch) => updateRow(r.key, patch)}
          />
        ))}
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 font-sans text-sm text-red-300 ring-1 ring-red-500/20">
          {error}
        </p>
      )}

      <div className="sticky bottom-0 -mx-4 mt-4 border-t border-white/10 bg-noir/95 px-4 py-3 backdrop-blur">
        <button
          onClick={confirm}
          disabled={phase === "saving" || willApply === 0}
          className="w-full rounded-xl bg-gold py-3.5 font-sans text-sm font-semibold text-noir transition active:scale-[0.98] disabled:opacity-40"
        >
          {phase === "saving"
            ? "Lançando…"
            : `Dar entrada em ${willApply} ${willApply === 1 ? "item" : "itens"}`}
        </button>
      </div>
    </div>
  );
}

function ReviewRow({
  row,
  catalog,
  onChange,
}: {
  row: Row;
  catalog: CatalogEntry[];
  onChange: (patch: Partial<Row>) => void;
}) {
  const [picking, setPicking] = useState(false);

  const statusColor = row.skip
    ? "border-white/5 bg-charcoal/30 opacity-60"
    : row.chosen
      ? row.match.confidence === "high"
        ? "border-emerald-500/20 bg-charcoal/60"
        : "border-amber-500/25 bg-charcoal/60"
      : "border-red-500/25 bg-charcoal/60";

  return (
    <div className={`rounded-xl border p-3 ${statusColor}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {row.code && (
            <span className="mr-1.5 rounded bg-white/10 px-1.5 py-0.5 font-sans text-[10px] font-semibold tracking-wide text-cool-gray">
              {row.code}
            </span>
          )}
          {row.isCombo && (
            <span className="mr-1.5 rounded bg-amber-500/15 px-1.5 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wide text-amber-300">
              combo
            </span>
          )}
          <span className="font-sans text-xs text-cool-gray">{row.description}</span>
        </div>
        <label className="flex shrink-0 items-center gap-1.5 font-sans text-[11px] text-cool-gray">
          <input
            type="checkbox"
            checked={row.skip}
            onChange={(e) => onChange({ skip: e.target.checked })}
            className="h-4 w-4 accent-gold"
          />
          Ignorar
        </label>
      </div>

      {!row.skip && (
        <div className="mt-2.5 flex items-center gap-2">
          {/* casamento */}
          <button
            onClick={() => setPicking((v) => !v)}
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-noir/60 px-3 py-2 text-left"
          >
            {row.chosen ? (
              <span className="line-clamp-1 font-sans text-sm text-white">{row.chosen.label}</span>
            ) : (
              <span className="font-sans text-sm text-red-300">Escolher produto…</span>
            )}
          </button>

          {/* quantidade */}
          <div className="flex shrink-0 items-center overflow-hidden rounded-lg border border-white/10 bg-noir/60">
            <button
              onClick={() => onChange({ qty: String(Math.max(0, Number(row.qty || 0) - 1)) })}
              className="px-2.5 py-2 text-lg text-white active:bg-white/10"
            >
              −
            </button>
            <input
              type="number"
              inputMode="numeric"
              value={row.qty}
              onChange={(e) => onChange({ qty: e.target.value })}
              className={`w-12 bg-transparent text-center font-sans text-base font-semibold tabular-nums text-white focus:outline-none ${
                row.qtyDerived == null ? "ring-1 ring-amber-500/40" : ""
              }`}
            />
            <button
              onClick={() => onChange({ qty: String(Number(row.qty || 0) + 1) })}
              className="px-2.5 py-2 text-lg text-white active:bg-white/10"
            >
              +
            </button>
          </div>
        </div>
      )}

      {picking && !row.skip && (
        <CatalogPicker
          catalog={catalog}
          initialQuery={row.description}
          onPick={(entry) => {
            onChange({ chosen: entry });
            setPicking(false);
          }}
          onClose={() => setPicking(false)}
        />
      )}
    </div>
  );
}

function CatalogPicker({
  catalog,
  initialQuery,
  onPick,
  onClose,
}: {
  catalog: CatalogEntry[];
  initialQuery: string;
  onPick: (entry: CatalogEntry) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const query = tokenize(q || initialQuery);
    const qset = new Set(query);
    return catalog
      .map((e) => {
        let hits = 0;
        for (const t of new Set(e.tokens)) if (qset.has(t)) hits++;
        return { e, hits };
      })
      .filter((x) => (q ? x.hits > 0 : true))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 30)
      .map((x) => x.e);
  }, [q, initialQuery, catalog]);

  return (
    <div className="mt-2 rounded-lg border border-white/10 bg-noir p-2">
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar produto no catálogo…"
        className="mb-2 w-full rounded-md border border-white/10 bg-charcoal px-3 py-2 font-sans text-sm text-white placeholder:text-cool-gray focus:border-gold/50 focus:outline-none"
      />
      <div className="max-h-56 overflow-y-auto">
        {results.map((e) => (
          <button
            key={`${e.productId}-${e.variantId ?? "p"}`}
            onClick={() => onPick(e)}
            className="block w-full rounded-md px-3 py-2 text-left font-sans text-sm text-white active:bg-white/10"
          >
            {e.label}
            {e.brand && <span className="ml-1.5 text-xs text-gold/70">{e.brand}</span>}
          </button>
        ))}
        {results.length === 0 && (
          <p className="px-3 py-4 text-center font-sans text-sm text-cool-gray">Nada encontrado.</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="mt-1 w-full rounded-md py-2 font-sans text-xs text-cool-gray active:bg-white/5"
      >
        Fechar
      </button>
    </div>
  );
}

// ---------- pré-tratamento da imagem (cinza + contraste + escala) ----------
async function preprocess(file: File): Promise<string> {
  const img = await loadImage(file);
  const maxDim = 2200;
  const scale = Math.min(2, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file2dataUrl(file);
  ctx.drawImage(img, 0, 0, w, h);

  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  const contrast = 1.4;
  const intercept = 128 * (1 - contrast);
  for (let i = 0; i < d.length; i += 4) {
    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    let v = contrast * gray + intercept;
    v = v < 0 ? 0 : v > 255 ? 255 : v;
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL("image/png");
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function file2dataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

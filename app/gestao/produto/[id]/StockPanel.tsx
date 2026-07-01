"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { brl } from "../../lib";
import { StockPill } from "../../StockPill";
import { sellStock, addStock, adjustStock } from "../../actions";

export interface PanelVariant {
  id: string | null; // null = produto simples (sem variante)
  name: string;
  stock: number;
  cost: number | null;
  resale: number | null;
}

type Mode = "sell" | "add" | "adjust";

const MODE_META: Record<Mode, { label: string; verb: string; accent: string; hint: string }> = {
  sell: { label: "Vender", verb: "Registrar venda", accent: "gold", hint: "Baixa do estoque" },
  add: { label: "Entrada", verb: "Dar entrada", accent: "emerald", hint: "Reposição / compra" },
  adjust: { label: "Ajustar", verb: "Salvar ajuste", accent: "sky", hint: "Definir contagem exata" },
};

export function StockPanel({
  productId,
  variants,
  hasVariants,
}: {
  productId: string;
  variants: PanelVariant[];
  hasVariants: boolean;
}) {
  const [sheet, setSheet] = useState<{ variant: PanelVariant; mode: Mode } | null>(null);

  return (
    <div className="mt-5">
      <SectionLabel>{hasVariants ? "Variações" : "Estoque"}</SectionLabel>

      <div className="space-y-2">
        {variants.map((v, i) => (
          <div
            key={v.id ?? `p-${i}`}
            className="rounded-xl border border-white/5 bg-charcoal/60 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {hasVariants && (
                  <p className="font-sans text-sm font-medium text-white">{v.name}</p>
                )}
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 font-sans text-xs text-cool-gray">
                  <span>
                    Custo <span className="text-white/80">{brl(v.cost)}</span>
                  </span>
                  <span>
                    Revenda <span className="text-gold">{brl(v.resale)}</span>
                  </span>
                </div>
              </div>
              <StockPill qty={v.stock} size="md" />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {(["sell", "add", "adjust"] as Mode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSheet({ variant: v, mode })}
                  className="rounded-lg border border-white/10 bg-noir/60 py-2 font-sans text-xs font-medium text-white transition active:scale-95 active:bg-noir"
                >
                  {MODE_META[mode].label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {sheet && (
        <OperationSheet
          productId={productId}
          variant={sheet.variant}
          mode={sheet.mode}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
}

function OperationSheet({
  productId,
  variant,
  mode,
  onClose,
}: {
  productId: string;
  variant: PanelVariant;
  mode: Mode;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const meta = MODE_META[mode];

  const [value, setValue] = useState<string>(mode === "adjust" ? String(variant.stock) : "1");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);

  const n = Math.trunc(Number(value));
  const projected =
    mode === "sell"
      ? variant.stock - (Number.isFinite(n) ? n : 0)
      : mode === "add"
        ? variant.stock + (Number.isFinite(n) ? n : 0)
        : Number.isFinite(n)
          ? n
          : variant.stock;

  function submit() {
    setError(null);
    startTransition(async () => {
      let res;
      if (mode === "sell") {
        res = await sellStock({ productId, variantId: variant.id, quantity: n, reference: note });
      } else if (mode === "add") {
        res = await addStock({ productId, variantId: variant.id, quantity: n, reason: note });
      } else {
        res = await adjustStock({ productId, variantId: variant.id, setTo: n, reason: note });
      }

      if (res.ok) {
        setDone(res.stockAfter);
        router.refresh();
        setTimeout(onClose, 900);
      } else {
        setError(res.error);
      }
    });
  }

  const invalid =
    mode === "adjust" ? n < 0 || Number.isNaN(n) : !n || n <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <button
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-lg rounded-t-2xl border-t border-white/10 bg-graphite p-5 pb-8 shadow-2xl animate-[slideUp_0.25s_ease-out]">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />

        {done !== null ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <p className="font-sans text-base font-medium text-white">Pronto!</p>
            <p className="mt-1 font-sans text-sm text-cool-gray">
              Estoque agora: <span className="font-semibold text-white">{done} un</span>
            </p>
          </div>
        ) : (
          <>
            <div className="mb-1 font-sans text-xs uppercase tracking-wide text-cool-gray">
              {meta.hint}
            </div>
            <h2 className="font-sans !text-xl !font-semibold !normal-case !tracking-normal text-white">
              {meta.label}
            </h2>
            <p className="mt-0.5 line-clamp-1 font-sans text-sm text-cool-gray">{variant.name}</p>

            {/* Entrada numérica */}
            <div className="mt-4">
              <label className="font-sans text-xs text-cool-gray">
                {mode === "adjust" ? "Nova quantidade em estoque" : "Quantidade"}
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <button
                  onClick={() => setValue(String(Math.max(0, n - 1)))}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-noir text-2xl text-white active:scale-95"
                >
                  −
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="h-12 w-full rounded-xl border border-white/10 bg-noir text-center font-sans text-2xl font-semibold tabular-nums text-white focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/20"
                />
                <button
                  onClick={() => setValue(String(n + 1))}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-noir text-2xl text-white active:scale-95"
                >
                  +
                </button>
              </div>
            </div>

            {/* Projeção */}
            <div className="mt-3 flex items-center justify-center gap-2 font-sans text-sm text-cool-gray">
              <span>{variant.stock} un</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
              <span className={`font-semibold ${projected < 0 ? "text-red-400" : "text-white"}`}>
                {projected} un
              </span>
            </div>

            {/* Nota opcional */}
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={mode === "sell" ? "Referência (opcional): cliente, obs…" : "Motivo (opcional)…"}
              className="mt-4 w-full rounded-xl border border-white/10 bg-noir px-4 py-3 font-sans text-sm text-white placeholder:text-cool-gray/70 focus:border-gold/50 focus:outline-none"
            />

            {error && (
              <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 font-sans text-sm text-red-300 ring-1 ring-red-500/20">
                {error}
              </p>
            )}

            <div className="mt-5 flex gap-2">
              <button
                onClick={onClose}
                disabled={pending}
                className="flex-1 rounded-xl border border-white/10 py-3.5 font-sans text-sm font-medium text-cool-gray active:bg-white/5 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={submit}
                disabled={pending || invalid}
                className="flex-[2] rounded-xl bg-gold py-3.5 font-sans text-sm font-semibold text-noir transition active:scale-[0.98] disabled:opacity-40"
              >
                {pending ? "Salvando…" : meta.verb}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 font-sans text-xs font-semibold uppercase tracking-widest text-cool-gray">
      {children}
    </div>
  );
}

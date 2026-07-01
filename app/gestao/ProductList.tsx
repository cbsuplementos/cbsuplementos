"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { brl, normalize } from "./lib";
import { StockPill } from "./StockPill";

export interface ProductRow {
  id: string;
  name: string;
  image: string | null;
  brand: string | null;
  active: boolean;
  totalStock: number;
  variantCount: number;
  fromResale: number | null;
}

export function ProductList({ rows }: { rows: ProductRow[] }) {
  const [query, setQuery] = useState("");
  const [onlyStock, setOnlyStock] = useState(false);

  const filtered = useMemo(() => {
    const q = normalize(query);
    return rows.filter((r) => {
      if (onlyStock && r.totalStock <= 0) return false;
      if (!q) return true;
      return (
        normalize(r.name).includes(q) ||
        (r.brand ? normalize(r.brand).includes(q) : false)
      );
    });
  }, [rows, query, onlyStock]);

  return (
    <div>
      {/* Busca */}
      <div className="sticky top-[68px] z-20 -mx-4 bg-noir/95 px-4 pb-3 pt-1 backdrop-blur">
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-cool-gray"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
          <input
            type="search"
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por produto ou marca…"
            className="w-full rounded-xl border border-white/10 bg-charcoal py-3 pl-11 pr-4 font-sans text-base text-white placeholder:text-cool-gray focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/20"
          />
        </div>

        <div className="mt-2 flex items-center justify-between">
          <button
            onClick={() => setOnlyStock((v) => !v)}
            className={`rounded-full px-3 py-1 font-sans text-xs font-medium ring-1 transition ${
              onlyStock
                ? "bg-gold/15 text-gold ring-gold/40"
                : "text-cool-gray ring-white/10"
            }`}
          >
            {onlyStock ? "✓ Só com estoque" : "Só com estoque"}
          </button>
          <span className="font-sans text-xs text-cool-gray">
            {filtered.length} {filtered.length === 1 ? "item" : "itens"}
          </span>
        </div>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="font-sans text-cool-gray">Nenhum produto encontrado.</p>
          <p className="mt-1 font-sans text-sm text-cool-gray/70">
            Tente outro termo ou desative o filtro de estoque.
          </p>
        </div>
      ) : (
        <ul className="mt-1 space-y-2">
          {filtered.map((r) => (
            <li key={r.id}>
              <Link
                href={`/gestao/produto/${r.id}`}
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-charcoal/60 p-2.5 transition active:scale-[0.99] active:bg-charcoal"
              >
                <Thumb src={r.image} alt={r.name} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {r.brand && (
                      <span className="truncate font-sans text-[11px] font-semibold uppercase tracking-wide text-gold/80">
                        {r.brand}
                      </span>
                    )}
                    {!r.active && (
                      <span className="rounded bg-white/10 px-1.5 py-0.5 font-sans text-[10px] uppercase tracking-wide text-cool-gray">
                        inativo
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 line-clamp-2 font-sans text-sm font-medium leading-tight text-white">
                    {r.name}
                  </p>
                  <div className="mt-1 flex items-center gap-2 font-sans text-xs text-cool-gray">
                    {r.fromResale != null && (
                      <span>
                        {r.variantCount > 1 ? "a partir de " : ""}
                        {brl(r.fromResale)}
                      </span>
                    )}
                    {r.variantCount > 0 && (
                      <span className="text-cool-gray/60">
                        · {r.variantCount} {r.variantCount === 1 ? "variação" : "variações"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  <StockPill qty={r.totalStock} size="md" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Thumb({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-white/5 bg-noir">
        <svg className="h-6 w-6 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 4.5h16.5a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5V6a1.5 1.5 0 011.5-1.5z" />
        </svg>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={alt}
      className="h-14 w-14 shrink-0 rounded-lg border border-white/5 object-cover"
      loading="lazy"
    />
  );
}

import { stockLevel } from "./lib";

/**
 * StockPill — o número de estoque como protagonista.
 * Verde = ok, âmbar = baixo (≤5), vermelho = zerado.
 */
export function StockPill({
  qty,
  size = "md",
  label = "un",
}: {
  qty: number;
  size?: "sm" | "md" | "lg";
  label?: string;
}) {
  const level = stockLevel(qty);

  const colors: Record<typeof level, string> = {
    ok: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
    low: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
    zero: "bg-red-500/15 text-red-300 ring-red-500/30",
  };

  const sizes = {
    sm: "text-sm px-2 py-0.5 gap-1",
    md: "text-base px-2.5 py-1 gap-1",
    lg: "text-2xl px-3.5 py-1.5 gap-1.5",
  };

  return (
    <span
      className={`inline-flex items-baseline rounded-lg font-sans font-semibold tabular-nums ring-1 ${colors[level]} ${sizes[size]}`}
    >
      {qty}
      <span className="text-[0.65em] font-normal opacity-70">{label}</span>
    </span>
  );
}

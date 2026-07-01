import { StockMovementType } from "@prisma/client";

interface Movement {
  id: string;
  type: StockMovementType;
  quantity: number;
  stockAfter: number;
  reason: string | null;
  reference: string | null;
  variantName: string | null;
  createdAt: string;
}

const TYPE_LABEL: Record<StockMovementType, string> = {
  INVENTARIO_INICIAL: "Inventário inicial",
  ENTRADA: "Entrada",
  SAIDA_VENDA_APP: "Venda (app)",
  SAIDA_VENDA_SITE: "Venda (site)",
  AJUSTE: "Ajuste",
  DEVOLUCAO: "Devolução",
};

export function MovementHistory({ movements }: { movements: Movement[] }) {
  if (movements.length === 0) {
    return (
      <div className="mt-6">
        <SectionLabel>Histórico</SectionLabel>
        <p className="rounded-xl border border-white/5 bg-charcoal/40 px-4 py-6 text-center font-sans text-sm text-cool-gray">
          Nenhuma movimentação ainda. Venda, entrada ou ajuste aparecem aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <SectionLabel>Histórico recente</SectionLabel>
      <ul className="space-y-1.5">
        {movements.map((m) => {
          const positive = m.quantity > 0;
          return (
            <li
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-charcoal/40 px-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-sans text-sm font-medium text-white">
                    {TYPE_LABEL[m.type]}
                  </span>
                  {m.variantName && (
                    <span className="truncate font-sans text-xs text-cool-gray">
                      · {m.variantName}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 font-sans text-xs text-cool-gray">
                  {formatDate(m.createdAt)}
                  {(m.reference || m.reason) && (
                    <span className="text-cool-gray/70"> · {m.reference || m.reason}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`font-sans text-sm font-semibold tabular-nums ${
                    positive ? "text-emerald-400" : m.quantity < 0 ? "text-red-400" : "text-cool-gray"
                  }`}
                >
                  {positive ? "+" : ""}
                  {m.quantity}
                </div>
                <div className="font-sans text-[11px] tabular-nums text-cool-gray">
                  → {m.stockAfter}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 font-sans text-xs font-semibold uppercase tracking-widest text-cool-gray">
      {children}
    </div>
  );
}

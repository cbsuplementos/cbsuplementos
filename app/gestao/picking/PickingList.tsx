"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/app/admin/pedidos/actions";

/**
 * PickingList (E7) — cards de separação, mobile-first no tema do /gestao.
 *
 * "Iniciar preparação" muda o pedido para PROCESSING pela MESMA server
 * action do admin (updateOrderStatus) — garante trilha de auditoria e
 * regras de estoque idênticas nos dois lugares. O estoque não muda aqui
 * (a baixa já aconteceu quando o pagamento foi aprovado).
 */

export interface PickingOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  place: string | null;
  waiting: string;
  total: string;
  itemCount: number;
  items: { id: string; name: string; variant: string | null; qty: number }[];
}

export function PickingList({ orders }: { orders: PickingOrder[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function start(order: PickingOrder) {
    if (!confirm(`Iniciar preparação do pedido ${order.orderNumber}?`)) return;
    setError(null);
    setBusyId(order.id);
    startTransition(async () => {
      const result = await updateOrderStatus({
        orderId: order.id,
        status: "PROCESSING",
      });
      setBusyId(null);
      if ("error" in result) {
        setError(`${order.orderNumber}: ${result.error}`);
        return;
      }
      router.refresh();
    });
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 p-8 text-center">
        <p className="font-sans text-sm text-cool-gray">
          Tudo separado. 🎉 Novos pedidos pagos aparecem aqui sozinhos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 font-sans text-xs text-red-300"
        >
          {error}
        </div>
      )}

      {orders.map((o) => (
        <div
          key={o.id}
          className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-xs font-medium text-gold">
                {o.orderNumber}
              </p>
              <p className="truncate font-sans text-sm font-medium text-white">
                {o.customerName}
              </p>
              {o.place && (
                <p className="truncate font-sans text-xs text-cool-gray">
                  {o.place}
                </p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="font-sans text-sm font-medium text-white">
                {o.total}
              </p>
              <p className="font-sans text-[11px] text-cool-gray">
                pago {o.waiting}
              </p>
            </div>
          </div>

          <ul className="mt-3 space-y-1.5 border-t border-white/10 pt-3">
            {o.items.map((item) => (
              <li key={item.id} className="flex items-center gap-2.5">
                <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md bg-gold/15 px-1.5 font-sans text-xs font-semibold text-gold">
                  {item.qty}×
                </span>
                <div className="min-w-0">
                  <p className="truncate font-sans text-sm text-white">
                    {item.name}
                  </p>
                  {item.variant && (
                    <p className="truncate font-sans text-xs text-cool-gray">
                      {item.variant}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <button
            onClick={() => start(o)}
            disabled={isPending}
            className="mt-3 w-full rounded-lg bg-gold px-4 py-2.5 font-sans text-sm font-semibold text-noir transition active:scale-[0.99] disabled:opacity-50"
          >
            {busyId === o.id
              ? "Iniciando…"
              : `Iniciar preparação (${o.itemCount} ite${o.itemCount === 1 ? "m" : "ns"})`}
          </button>
        </div>
      ))}
    </div>
  );
}

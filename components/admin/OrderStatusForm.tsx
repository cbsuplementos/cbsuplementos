"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/app/admin/pedidos/actions";

/**
 * OrderStatusForm (QW6) — troca de status com confirmação explícita.
 *
 * Antes de aplicar, mostra um confirm() dizendo exatamente o que vai
 * acontecer — em especial quando a transição mexe no estoque:
 *  - cancelar/reembolsar um pedido com estoque baixado → DEVOLVE;
 *  - marcar como pago (ou além) um pedido não baixado → BAIXA.
 * O servidor revalida tudo de novo (a confirmação é UX, não segurança).
 */

const statusLabels: Record<string, string> = {
  PENDING: "Aguardando pagamento",
  PAYMENT_APPROVED: "Pago",
  PROCESSING: "Em preparação",
  SHIPPED: "Saiu para entrega",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

const PAID_FAMILY = ["PAYMENT_APPROVED", "PROCESSING", "SHIPPED", "DELIVERED"];

interface OrderStatusFormProps {
  orderId: string;
  currentStatus: string;
  trackingCode: string;
  itemCount: number;
  /** true quando o estoque deste pedido está baixado (e não devolvido). */
  netDebited: boolean;
}

export default function OrderStatusForm({
  orderId,
  currentStatus,
  trackingCode,
  itemCount,
  netDebited,
}: OrderStatusFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(currentStatus);
  const [tracking, setTracking] = useState(trackingCode);
  const [feedback, setFeedback] = useState<
    { kind: "ok" | "erro"; text: string } | null
  >(null);

  const itens = `${itemCount} ite${itemCount === 1 ? "m" : "ns"}`;

  function submit() {
    setFeedback(null);

    const changingStatus = status !== currentStatus;
    const changingTracking = tracking.trim() !== (trackingCode ?? "").trim();

    if (!changingStatus && !changingTracking) {
      setFeedback({ kind: "erro", text: "Nada a alterar." });
      return;
    }

    if (changingStatus) {
      let msg = `Mudar o status de "${statusLabels[currentStatus]}" para "${statusLabels[status]}"?`;

      if ((status === "CANCELLED" || status === "REFUNDED") && netDebited) {
        msg += `\n\n⚠ O estoque deste pedido (${itens}) será DEVOLVIDO ao catálogo.`;
      } else if (PAID_FAMILY.includes(status) && !netDebited) {
        msg += `\n\n⚠ O pedido será tratado como pago: o estoque (${itens}) será BAIXADO agora.`;
      }

      if (!confirm(msg)) return;
    }

    startTransition(async () => {
      const result = await updateOrderStatus({
        orderId,
        status,
        trackingCode: tracking,
      });
      if ("error" in result) {
        setFeedback({ kind: "erro", text: result.error });
        return;
      }
      setFeedback({ kind: "ok", text: result.message });
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            Alterar status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            Rastreio (opcional)
          </label>
          <input
            type="text"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="Código de rastreio"
            className="px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <button
          onClick={submit}
          disabled={isPending}
          className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 disabled:opacity-40"
        >
          {isPending ? "Aplicando…" : "Atualizar"}
        </button>
      </div>

      {feedback && (
        <div
          role="status"
          className={`mt-3 px-4 py-2.5 rounded-lg text-sm border ${
            feedback.kind === "ok"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {feedback.text}
        </div>
      )}
    </div>
  );
}

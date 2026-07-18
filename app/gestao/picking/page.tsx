import { prisma } from "@/lib/db";
import Link from "next/link";
import { PickingList, type PickingOrder } from "./PickingList";

export const dynamic = "force-dynamic";

/**
 * /gestao/picking (E7) — Separação de pedidos.
 *
 * Fila dos pedidos PAGOS (PAYMENT_APPROVED) aguardando separação,
 * do mais antigo para o mais novo. Cada card lista os itens com
 * quantidade; o botão "Iniciar preparação" muda o pedido para
 * "Em preparação" (PROCESSING) — a mudança entra na trilha de
 * auditoria (QW6) com o nome de quem tocou.
 */

function timeSince(date: Date): string {
  const mins = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h${mins % 60 ? ` ${mins % 60}min` : ""}`;
  const days = Math.floor(hours / 24);
  return `há ${days} dia${days === 1 ? "" : "s"}`;
}

const fmt = (v: unknown) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(v)
  );

export default async function PickingPage() {
  const orders = await prisma.order.findMany({
    where: { status: "PAYMENT_APPROVED" },
    orderBy: { paidAt: "asc" },
    include: {
      customer: { select: { name: true } },
      address: { select: { neighborhood: true, city: true } },
      items: {
        select: {
          id: true,
          productName: true,
          variantName: true,
          quantity: true,
        },
      },
    },
  });

  const rows: PickingOrder[] = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customer.name,
    place: o.address ? `${o.address.neighborhood} · ${o.address.city}` : null,
    waiting: timeSince(o.paidAt ?? o.createdAt),
    total: fmt(o.total),
    itemCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
    items: o.items.map((i) => ({
      id: i.id,
      name: i.productName,
      variant: i.variantName,
      qty: i.quantity,
    })),
  }));

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl text-white">Separação</h1>
          <p className="font-sans text-xs text-cool-gray">
            {rows.length === 0
              ? "Nenhum pedido aguardando separação."
              : `${rows.length} pedido${rows.length === 1 ? "" : "s"} pago${rows.length === 1 ? "" : "s"} aguardando.`}
          </p>
        </div>
        <Link
          href="/gestao"
          className="rounded-lg px-3 py-1.5 font-sans text-xs font-medium text-cool-gray ring-1 ring-white/10"
        >
          ← Estoque
        </Link>
      </div>

      <PickingList orders={rows} />
    </>
  );
}

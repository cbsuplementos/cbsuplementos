import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Image from "next/image";
import OrderStatusForm from "@/components/admin/OrderStatusForm";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  PENDING: "Aguardando pagamento",
  PAYMENT_APPROVED: "Pago",
  PROCESSING: "Em preparação",
  SHIPPED: "Saiu para entrega",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

const statusFlow = ["PENDING", "PAYMENT_APPROVED", "PROCESSING", "SHIPPED", "DELIVERED"];

interface PageProps { params: Promise<{ id: string }> }

export default async function AdminPedidoDetailPage({ params }: PageProps) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      address: true,
      items: true,
      statusLogs: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) notFound();

  // Nomes dos usuários que aparecem na trilha de auditoria
  const logUserIds = [
    ...new Set(order.statusLogs.map((l) => l.userId).filter((v): v is string => !!v)),
  ];
  const logUsers = logUserIds.length
    ? await prisma.user.findMany({
        where: { id: { in: logUserIds } },
        select: { id: true, name: true },
      })
    : [];
  const userName = new Map(logUsers.map((u) => [u.id, u.name]));

  const netDebited = order.stockDebitedAt !== null && order.stockReturnedAt === null;

  const fmt = (v: number | unknown) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));

  const currentIdx = statusFlow.indexOf(order.status);

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <a href="/admin/pedidos" className="text-sm text-amber-600 hover:text-amber-700">← Voltar aos pedidos</a>
        <h1 className="text-2xl font-bold text-neutral-900 mt-2">Pedido {order.orderNumber}</h1>
        <p className="text-neutral-500 text-sm">
          {new Date(order.createdAt).toLocaleString("pt-BR")} · {order.paymentMethod === "pix" ? "Pix" : "Cartão"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status + ações */}
          <div className="bg-white p-6 rounded-xl border border-neutral-200">
            <h2 className="text-lg font-semibold mb-4">Status do Pedido</h2>
            <div className="flex flex-wrap gap-2 mb-6">
              {statusFlow.map((s, i) => (
                <div key={s} className={`px-3 py-1.5 rounded-full text-xs font-medium ${i <= currentIdx ? "bg-green-100 text-green-800" : "bg-neutral-100 text-neutral-400"}`}>
                  {statusLabels[s]}
                </div>
              ))}
            </div>

            {(order.stockDebitedAt || order.stockReturnedAt) && (
              <p className="text-xs text-neutral-500 mb-4">
                {netDebited ? (
                  <>Estoque baixado em {new Date(order.stockDebitedAt!).toLocaleString("pt-BR")}.</>
                ) : (
                  <>Estoque devolvido em {new Date(order.stockReturnedAt!).toLocaleString("pt-BR")}.</>
                )}
              </p>
            )}

            <OrderStatusForm
              orderId={order.id}
              currentStatus={order.status}
              trackingCode={order.trackingCode ?? ""}
              itemCount={order.items.length}
              netDebited={netDebited}
            />
          </div>

          {/* Itens */}
          <div className="bg-white p-6 rounded-xl border border-neutral-200">
            <h2 className="text-lg font-semibold mb-4">Itens do pedido</h2>
            <div className="space-y-3">
              {order.items.map(item => (
                <div key={item.id} className="flex gap-4 items-center">
                  <div className="relative w-14 h-16 rounded overflow-hidden bg-neutral-100 flex-shrink-0">
                    <Image src={item.productImage} alt={item.productName} fill sizes="56px" className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900">{item.productName}</p>
                    {item.variantName && <p className="text-xs text-neutral-500">{item.variantName}</p>}
                    <p className="text-xs text-neutral-500">Qtd: {item.quantity} × {fmt(item.unitPrice)}</p>
                  </div>
                  <p className="text-sm font-semibold">{fmt(Number(item.unitPrice) * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Histórico de status (QW6) */}
          <div className="bg-white p-6 rounded-xl border border-neutral-200">
            <h2 className="text-lg font-semibold mb-4">Histórico de status</h2>
            {order.statusLogs.length === 0 ? (
              <p className="text-sm text-neutral-400">
                Nenhuma mudança registrada ainda. (O histórico passou a ser
                gravado a partir da ativação da auditoria.)
              </p>
            ) : (
              <ol className="space-y-3">
                {order.statusLogs.map((log) => {
                  const who =
                    log.origin === "ADMIN"
                      ? (log.userId && userName.get(log.userId)) || "Admin"
                      : log.origin === "WEBHOOK"
                        ? "Mercado Pago"
                        : "Sistema";
                  return (
                    <li key={log.id} className="flex gap-3 text-sm">
                      <span className="text-xs text-neutral-400 whitespace-nowrap pt-0.5 w-32 flex-shrink-0">
                        {new Date(log.createdAt).toLocaleString("pt-BR")}
                      </span>
                      <div className="min-w-0">
                        <p className="text-neutral-900">
                          {statusLabels[log.fromStatus] ?? log.fromStatus}
                          {" → "}
                          <span className="font-medium">
                            {statusLabels[log.toStatus] ?? log.toStatus}
                          </span>
                        </p>
                        <p className="text-xs text-neutral-500">
                          por {who}
                          {log.note ? ` · ${log.note}` : ""}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Valores */}
          <div className="bg-white p-6 rounded-xl border border-neutral-200">
            <h3 className="font-semibold mb-3">Valores</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-neutral-600">Subtotal</span><span>{fmt(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-neutral-600">Frete ({order.shippingMethod})</span><span>{Number(order.shippingCost) === 0 ? "Grátis" : fmt(order.shippingCost)}</span></div>
              <hr />
              <div className="flex justify-between font-bold text-base"><span>Total</span><span>{fmt(order.total)}</span></div>
            </div>
          </div>

          {/* Cliente */}
          <div className="bg-white p-6 rounded-xl border border-neutral-200">
            <h3 className="font-semibold mb-3">Cliente</h3>
            <p className="text-sm font-medium text-neutral-900">{order.customer.name}</p>
            <p className="text-xs text-neutral-500">{order.customer.email}</p>
            {order.customer.phone && <p className="text-xs text-neutral-500">{order.customer.phone}</p>}
          </div>

          {/* Endereço */}
          {order.address && (
            <div className="bg-white p-6 rounded-xl border border-neutral-200">
              <h3 className="font-semibold mb-3">Endereço</h3>
              <p className="text-sm text-neutral-700">{order.address.street}, {order.address.number}</p>
              {order.address.complement && <p className="text-sm text-neutral-500">{order.address.complement}</p>}
              <p className="text-sm text-neutral-700">{order.address.neighborhood}</p>
              <p className="text-sm text-neutral-700">{order.address.city} — {order.address.state}</p>
              <p className="text-sm text-neutral-500">CEP: {order.address.cep}</p>
            </div>
          )}

          {order.trackingCode && (
            <div className="bg-white p-6 rounded-xl border border-neutral-200">
              <h3 className="font-semibold mb-2">Rastreio</h3>
              <p className="text-sm font-mono text-amber-700">{order.trackingCode}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  PENDING: "Aguardando pagamento",
  PAYMENT_APPROVED: "Pago",
  PROCESSING: "Em preparação",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

const statusFlow = ["PENDING", "PAYMENT_APPROVED", "PROCESSING", "SHIPPED", "DELIVERED"];

async function updateStatus(formData: FormData) {
  "use server";
  const id = formData.get("orderId") as string;
  const status = formData.get("status") as string;
  const trackingCode = formData.get("trackingCode") as string;

  await prisma.order.update({
    where: { id },
    data: {
      status: status as never,
      ...(trackingCode ? { trackingCode } : {}),
    },
  });

  redirect(`/admin/pedidos/${id}`);
}

interface PageProps { params: Promise<{ id: string }> }

export default async function AdminPedidoDetailPage({ params }: PageProps) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      address: true,
      items: true,
    },
  });

  if (!order) notFound();

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

            <form action={updateStatus} className="flex flex-wrap gap-3 items-end">
              <input type="hidden" name="orderId" value={order.id} />
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Alterar status</label>
                <select name="status" defaultValue={order.status}
                  className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Rastreio (opcional)</label>
                <input name="trackingCode" type="text" defaultValue={order.trackingCode || ""} placeholder="Código de rastreio"
                  className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <button type="submit" className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800">
                Atualizar
              </button>
            </form>
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

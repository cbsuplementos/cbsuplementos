import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/customer-auth";
import { prisma } from "@/lib/db";
import { expireStalePendingOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Meus Pedidos | CB Suplementos",
};

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Aguardando pagamento", color: "bg-yellow-100 text-yellow-800" },
  PAYMENT_APPROVED: { label: "Pago", color: "bg-green-100 text-green-800" },
  PROCESSING: { label: "Em preparação", color: "bg-blue-100 text-blue-800" },
  SHIPPED: { label: "Enviado", color: "bg-purple-100 text-purple-800" },
  DELIVERED: { label: "Entregue", color: "bg-emerald-100 text-emerald-800" },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800" },
  REFUNDED: { label: "Reembolsado", color: "bg-charcoal text-white" },
};

export default async function MeusPedidosPage() {
  const session = await getCustomerSession();
  if (!session) redirect("/conta/login");

  // Garante que pedidos Pix não pagos apareçam como cancelados (e não
  // "aguardando pagamento" para sempre) também na visão do cliente.
  await expireStalePendingOrders();

  const orders = await prisma.order.findMany({
    where: { customerId: session.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { items: true } },
    },
  });

  const fmt = (v: unknown) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));

  return (
    <section className="min-h-screen bg-noir">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8">
          <Link href="/minha-conta" className="text-sm text-gold hover:text-gold-light">
            ← Minha conta
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-white mt-2">
            Meus Pedidos
          </h1>
          <p className="text-cool-gray mt-1">{orders.length} {orders.length === 1 ? "pedido" : "pedidos"} no total</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-charcoal p-12 rounded-xl border border-gold/15 text-center">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-cool-gray mb-6">Você ainda não fez nenhum pedido.</p>
            <Link href="/produtos" className="inline-block px-6 py-3 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors">
              Ver produtos
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const s = statusLabels[order.status] || statusLabels.PENDING;
              return (
                <Link
                  key={order.id}
                  href={`/minha-conta/pedidos/${order.orderNumber}`}
                  className="block bg-charcoal p-5 rounded-xl border border-gold/15 hover:border-gold hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <p className="font-mono text-sm font-medium text-white">{order.orderNumber}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.color}`}>
                          {s.label}
                        </span>
                      </div>
                      <p className="text-xs text-cool-gray">
                        {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit", month: "long", year: "numeric",
                          hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                      <p className="text-xs text-cool-gray mt-1">
                        {order._count.items} {order._count.items === 1 ? "item" : "itens"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">{fmt(order.total)}</p>
                      <p className="text-xs text-gold mt-1 font-medium">Ver detalhes →</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

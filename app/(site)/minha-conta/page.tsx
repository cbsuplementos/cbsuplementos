import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/customer-auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Minha Conta | CB Suplementos",
};

export default async function MinhaContaPage() {
  const session = await getCustomerSession();
  if (!session) redirect("/conta/login");

  const customer = await prisma.customer.findUnique({
    where: { id: session.id },
    include: {
      _count: { select: { orders: true } },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
        },
      },
    },
  });

  if (!customer) redirect("/conta/login");

  const fmt = (v: unknown) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));

  const statusLabels: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Aguardando pagamento", color: "bg-yellow-100 text-yellow-800" },
    PAYMENT_APPROVED: { label: "Pago", color: "bg-green-100 text-green-800" },
    PROCESSING: { label: "Em preparação", color: "bg-blue-100 text-blue-800" },
    SHIPPED: { label: "Enviado", color: "bg-purple-100 text-purple-800" },
    DELIVERED: { label: "Entregue", color: "bg-emerald-100 text-emerald-800" },
    CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800" },
    REFUNDED: { label: "Reembolsado", color: "bg-neutral-100 text-neutral-800" },
  };

  return (
    <section className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-neutral-900">
            Olá, {customer.name.split(" ")[0]}!
          </h1>
          <p className="text-neutral-500 mt-1">Bem-vindo de volta à CB Suplementos.</p>
        </div>

        {/* Cards de navegação */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <Link href="/minha-conta/pedidos" className="bg-white p-6 rounded-xl border border-neutral-200 hover:border-amber-400 hover:shadow-md transition-all">
            <div className="text-3xl mb-2">📦</div>
            <h2 className="font-semibold text-neutral-900">Meus Pedidos</h2>
            <p className="text-xs text-neutral-500 mt-1">{customer._count.orders} {customer._count.orders === 1 ? "pedido" : "pedidos"}</p>
          </Link>

          <Link href="/carrinho" className="bg-white p-6 rounded-xl border border-neutral-200 hover:border-amber-400 hover:shadow-md transition-all">
            <div className="text-3xl mb-2">🛒</div>
            <h2 className="font-semibold text-neutral-900">Carrinho</h2>
            <p className="text-xs text-neutral-500 mt-1">Ver itens no carrinho</p>
          </Link>

          <Link href="/produtos" className="bg-white p-6 rounded-xl border border-neutral-200 hover:border-amber-400 hover:shadow-md transition-all">
            <div className="text-3xl mb-2">🛍️</div>
            <h2 className="font-semibold text-neutral-900">Comprar</h2>
            <p className="text-xs text-neutral-500 mt-1">Ver produtos disponíveis</p>
          </Link>
        </div>

        {/* Últimos pedidos */}
        {customer.orders.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">Últimos pedidos</h2>
              <Link href="/minha-conta/pedidos" className="text-sm text-amber-600 hover:text-amber-700">
                Ver todos →
              </Link>
            </div>
            <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100">
              {customer.orders.map((order) => {
                const s = statusLabels[order.status] || statusLabels.PENDING;
                return (
                  <Link
                    key={order.id}
                    href={`/minha-conta/pedidos/${order.orderNumber}`}
                    className="block p-4 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="font-mono text-sm font-medium text-neutral-900">{order.orderNumber}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                            day: "2-digit", month: "long", year: "numeric"
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.color}`}>
                          {s.label}
                        </span>
                        <span className="font-semibold text-neutral-900">{fmt(order.total)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

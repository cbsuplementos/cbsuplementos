import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Aguardando pagamento", color: "bg-yellow-100 text-yellow-800" },
  PAYMENT_APPROVED: { label: "Pago", color: "bg-green-100 text-green-800" },
  PROCESSING: { label: "Em preparação", color: "bg-blue-100 text-blue-800" },
  SHIPPED: { label: "Enviado", color: "bg-purple-100 text-purple-800" },
  DELIVERED: { label: "Entregue", color: "bg-emerald-100 text-emerald-800" },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800" },
  REFUNDED: { label: "Reembolsado", color: "bg-neutral-100 text-neutral-800" },
};

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string }>;
}

export default async function AdminPedidosPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = params.status || "";
  const searchTerm = params.q || "";

  // ====== MÉTRICAS ======
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(); startOfWeek.setDate(startOfWeek.getDate() - 7);
  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);

  const [todayCount, weekCount, monthSum, allCount, pendingCount, paidNotProcessed] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: startOfDay }, status: { not: "CANCELLED" } } }),
    prisma.order.count({ where: { createdAt: { gte: startOfWeek }, status: { not: "CANCELLED" } } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: startOfMonth }, status: { in: ["PAYMENT_APPROVED", "PROCESSING", "SHIPPED", "DELIVERED"] } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "PAYMENT_APPROVED" } }),
  ]);

  // ====== LISTAGEM FILTRADA ======
  const where: Record<string, unknown> = {};
  if (statusFilter) where.status = statusFilter;
  if (searchTerm) {
    where.OR = [
      { orderNumber: { contains: searchTerm, mode: "insensitive" } },
      { customer: { name: { contains: searchTerm, mode: "insensitive" } } },
      { customer: { email: { contains: searchTerm, mode: "insensitive" } } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true, email: true } },
      _count: { select: { items: true } },
    },
    take: 100,
  });

  const fmt = (v: unknown) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));

  const monthTotal = Number(monthSum._sum?.total || 0);
  const monthCount = monthSum._count;
  const ticketMedio = monthCount > 0 ? monthTotal / monthCount : 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Pedidos</h1>
        <p className="mt-1 text-neutral-500">Painel completo de gerenciamento de pedidos</p>
      </div>

      {/* ====== MÉTRICAS ====== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-neutral-200">
          <p className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Hoje</p>
          <p className="text-2xl font-bold text-neutral-900">{todayCount}</p>
          <p className="text-xs text-neutral-400 mt-1">pedidos</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-neutral-200">
          <p className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Últimos 7 dias</p>
          <p className="text-2xl font-bold text-neutral-900">{weekCount}</p>
          <p className="text-xs text-neutral-400 mt-1">pedidos</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-neutral-200">
          <p className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Faturamento do mês</p>
          <p className="text-2xl font-bold text-neutral-900">{fmt(monthTotal)}</p>
          <p className="text-xs text-neutral-400 mt-1">{monthCount} pedidos pagos</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-neutral-200">
          <p className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Ticket médio</p>
          <p className="text-2xl font-bold text-neutral-900">{fmt(ticketMedio)}</p>
          <p className="text-xs text-neutral-400 mt-1">por pedido</p>
        </div>
      </div>

      {/* ====== ALERTAS ====== */}
      {(paidNotProcessed > 0 || pendingCount > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {paidNotProcessed > 0 && (
            <Link href="/admin/pedidos?status=PAYMENT_APPROVED" className="bg-green-50 border-2 border-green-200 p-5 rounded-xl hover:border-green-300 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-900">⚡ Pagos aguardando preparação</p>
                  <p className="text-xs text-green-700 mt-1">Precisam ser processados</p>
                </div>
                <p className="text-3xl font-bold text-green-700">{paidNotProcessed}</p>
              </div>
            </Link>
          )}
          {pendingCount > 0 && (
            <Link href="/admin/pedidos?status=PENDING" className="bg-yellow-50 border-2 border-yellow-200 p-5 rounded-xl hover:border-yellow-300 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-yellow-900">⏳ Aguardando pagamento</p>
                  <p className="text-xs text-yellow-700 mt-1">Pix pendentes</p>
                </div>
                <p className="text-3xl font-bold text-yellow-700">{pendingCount}</p>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* ====== FILTROS ====== */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 mb-6">
        <form method="GET" className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-neutral-600 mb-1">Buscar</label>
            <input
              type="text"
              name="q"
              defaultValue={searchTerm}
              placeholder="Número do pedido, nome ou email"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Status</label>
            <select name="status" defaultValue={statusFilter}
              className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
              <option value="">Todos</option>
              {Object.entries(statusLabels).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800">
            Filtrar
          </button>
          {(statusFilter || searchTerm) && (
            <Link href="/admin/pedidos" className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900">
              Limpar
            </Link>
          )}
        </form>
      </div>

      {/* ====== TABELA ====== */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
          <p className="text-sm text-neutral-600">
            Mostrando {orders.length} de {allCount} pedidos
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16 text-neutral-400">Nenhum pedido encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="text-left px-4 py-3 font-medium text-neutral-600">Pedido</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-600">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-600">Total</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-600">Data</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const s = statusLabels[order.status] || statusLabels.PENDING;
                  return (
                    <tr key={order.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="px-4 py-3 font-mono text-xs font-medium">{order.orderNumber}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-neutral-900">{order.customer.name}</p>
                        <p className="text-xs text-neutral-500">{order.customer.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>
                      </td>
                      <td className="px-4 py-3 font-medium">{fmt(order.total)}</td>
                      <td className="px-4 py-3 text-neutral-500 text-xs">
                        {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/pedidos/${order.id}`} className="text-amber-600 hover:text-amber-700 text-xs font-medium">
                          Ver →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

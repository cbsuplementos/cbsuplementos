import { prisma } from "@/lib/db";
import Link from "next/link";
import { expireStalePendingOrders } from "@/lib/orders";
import Pagination from "@/components/admin/Pagination";

const PER_PAGE = 25;

export const dynamic = "force-dynamic";

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Aguardando pagamento", color: "bg-yellow-100 text-yellow-800" },
  PAYMENT_APPROVED: { label: "Pago", color: "bg-green-100 text-green-800" },
  PROCESSING: { label: "Em preparação", color: "bg-blue-100 text-blue-800" },
  SHIPPED: { label: "Saiu para entrega", color: "bg-purple-100 text-purple-800" },
  DELIVERED: { label: "Entregue", color: "bg-emerald-100 text-emerald-800" },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800" },
  REFUNDED: { label: "Reembolsado", color: "bg-neutral-100 text-neutral-800" },
};

interface PageProps {
  searchParams: Promise<{
    status?: string;
    q?: string;
    ordem?: string;  // "data" | "total"
    dir?: string;    // "asc" | "desc"
    pagina?: string; // 1-based
  }>;
}

export default async function AdminPedidosPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = params.status || "";
  const searchTerm = params.q || "";
  const ordem = params.ordem === "total" ? "total" : "data";
  const dir: "asc" | "desc" = params.dir === "asc" ? "asc" : "desc";
  const paginaRaw = parseInt(params.pagina ?? "1", 10);

  // Limpa pedidos PENDING expirados antes de calcular métricas e listar,
  // para que não fiquem "presos" no painel aguardando pagamento eterno.
  await expireStalePendingOrders();

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

  // ====== PAGINAÇÃO SERVER-SIDE (QW7) ======
  // Pedidos crescem sem limite, então aqui o corte é no banco
  // (skip/take), diferente da lista de produtos.
  const filteredCount = await prisma.order.count({ where });
  const totalPages = Math.max(1, Math.ceil(filteredCount / PER_PAGE));
  const page = Math.min(
    Math.max(1, Number.isFinite(paginaRaw) ? paginaRaw : 1),
    totalPages
  );

  const orders = await prisma.order.findMany({
    where,
    orderBy: ordem === "total" ? { total: dir } : { createdAt: dir },
    include: {
      customer: { select: { name: true, email: true, phone: true } },
      address: { select: { city: true, state: true, neighborhood: true } },
      _count: { select: { items: true } },
    },
    skip: (page - 1) * PER_PAGE,
    take: PER_PAGE,
  });

  // querystring que preserva filtros + ordenação entre os links
  const baseParams: Record<string, string> = {};
  if (statusFilter) baseParams.status = statusFilter;
  if (searchTerm) baseParams.q = searchTerm;
  baseParams.ordem = ordem;
  baseParams.dir = dir;
  const qs = (overrides: Record<string, string | null>) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...baseParams, ...overrides })) {
      if (v !== null && v !== "") sp.set(k, v);
    }
    const str = sp.toString();
    return str ? `/admin/pedidos?${str}` : "/admin/pedidos";
  };
  const sortHref = (field: "data" | "total") =>
    qs({
      ordem: field,
      dir: ordem === field ? (dir === "asc" ? "desc" : "asc") : "desc",
      pagina: null,
    });
  const sortIcon = (field: "data" | "total") =>
    ordem === field ? (dir === "asc" ? "▲" : "▼") : "▵";

  /**
   * Link de WhatsApp a partir do telefone salvo (QW5).
   * Normaliza para dígitos e garante o DDI 55 (números BR têm 10-11
   * dígitos com DDD). Retorna null se o telefone não parecer válido.
   */
  const whatsappHref = (phone: string | null): string | null => {
    if (!phone) return null;
    let digits = phone.replace(/\D/g, "");
    if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
    if (digits.length < 12 || digits.length > 13) return null;
    return `https://wa.me/${digits}`;
  };

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
          <input type="hidden" name="ordem" value={ordem} />
          <input type="hidden" name="dir" value={dir} />
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-neutral-600 mb-1">Buscar</label>
            <input
              type="text"
              name="q"
              defaultValue={searchTerm}
              placeholder="Número do pedido, nome ou email"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Status</label>
            <select name="status" defaultValue={statusFilter}
              className="px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500">
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
            {filteredCount === allCount
              ? `${allCount} pedidos`
              : `Filtro ativo — ${filteredCount} de ${allCount} pedidos`}
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
                  <th className="text-left px-4 py-3 font-medium text-neutral-600">Cidade</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-600">
                    <Link href={sortHref("total")} className="inline-flex items-center gap-1 hover:text-neutral-900">
                      Total <span className="text-[10px] leading-none">{sortIcon("total")}</span>
                    </Link>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-600">
                    <Link href={sortHref("data")} className="inline-flex items-center gap-1 hover:text-neutral-900">
                      Data <span className="text-[10px] leading-none">{sortIcon("data")}</span>
                    </Link>
                  </th>
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
                        {(() => {
                          const wa = whatsappHref(order.customer.phone);
                          if (!wa) return null;
                          return (
                            <a
                              href={wa}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-700"
                              title={`WhatsApp: ${order.customer.phone}`}
                            >
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.39c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.9-4.44 9.9-9.9S17.5 2 12.04 2zm0 18.02c-1.48 0-2.94-.4-4.2-1.15l-.3-.18-3.14.82.84-3.07-.2-.31a8.04 8.04 0 01-1.23-4.28c0-4.45 3.62-8.07 8.07-8.07s8.07 3.62 8.07 8.07-3.62 8.17-7.91 8.17zm4.43-6.05c-.24-.12-1.43-.71-1.66-.79-.22-.08-.38-.12-.55.12-.16.24-.63.79-.77.95-.14.16-.28.18-.53.06-.24-.12-1.02-.38-1.95-1.2-.72-.64-1.2-1.43-1.35-1.67-.14-.24-.01-.37.11-.5.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.32-.75-1.8-.2-.48-.4-.42-.55-.42l-.47-.01c-.16 0-.42.06-.65.3-.22.24-.85.83-.85 2.03s.87 2.36 1 2.52c.12.16 1.72 2.62 4.16 3.68.58.25 1.04.4 1.39.51.58.19 1.12.16 1.54.1.47-.07 1.43-.58 1.63-1.15.2-.56.2-1.05.14-1.15-.06-.1-.22-.16-.46-.28z" />
                              </svg>
                              WhatsApp
                            </a>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-600">
                        {order.address ? (
                          <>
                            <p>{order.address.city}/{order.address.state}</p>
                            <p className="text-neutral-400">{order.address.neighborhood}</p>
                          </>
                        ) : (
                          <span className="text-neutral-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>
                      </td>
                      <td className="px-4 py-3 font-medium">{fmt(order.total)}</td>
                      <td className="px-4 py-3 text-neutral-500 text-xs whitespace-nowrap">
                        <p>{new Date(order.createdAt).toLocaleDateString("pt-BR")}</p>
                        <p className="text-neutral-400">
                          {new Date(order.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
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
        <Pagination
          total={filteredCount}
          page={page}
          perPage={PER_PAGE}
          hrefFor={(p) => qs({ pagina: p === 1 ? null : String(p) })}
          labelSingular="pedido"
          labelPlural="pedidos"
        />
      </div>
    </div>
  );
}

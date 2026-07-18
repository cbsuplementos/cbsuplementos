import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { effectiveStock } from "@/lib/product-stock";

/**
 * Dashboard — /admin/dashboard (E4)
 *
 * Tela inicial do painel com dados reais de operação:
 * - Vendas: faturamento e ticket médio do mês, pedidos hoje/semana,
 *   fila de separação (pagos aguardando preparação);
 * - Catálogo: ativos, estoque baixo/esgotado (estoque EFETIVO, mesma
 *   regra do site), produtos sem marca — cada card leva pra lista
 *   já filtrada;
 * - Últimos pedidos e atalhos.
 *
 * Server Component — força dynamic para sempre refletir o banco.
 */
export const dynamic = "force-dynamic";

const fmt = (v: unknown) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(v ?? 0)
  );

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Aguardando pagamento", color: "bg-amber-100 text-amber-800" },
  PAYMENT_APPROVED: { label: "Pago", color: "bg-green-100 text-green-800" },
  PROCESSING: { label: "Em preparação", color: "bg-blue-100 text-blue-800" },
  SHIPPED: { label: "Saiu para entrega", color: "bg-indigo-100 text-indigo-800" },
  DELIVERED: { label: "Entregue", color: "bg-emerald-100 text-emerald-800" },
  CANCELLED: { label: "Cancelado", color: "bg-neutral-100 text-neutral-500" },
  REFUNDED: { label: "Reembolsado", color: "bg-red-100 text-red-700" },
};

export default async function DashboardPage() {
  const session = await auth();

  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(); startOfWeek.setDate(startOfWeek.getDate() - 7);
  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);

  const [
    monthAgg,
    todayCount,
    weekCount,
    toPick,
    pendingCount,
    products,
    unbranded,
    recentOrders,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: {
        createdAt: { gte: startOfMonth },
        status: { in: ["PAYMENT_APPROVED", "PROCESSING", "SHIPPED", "DELIVERED"] },
      },
      _sum: { total: true },
      _count: true,
    }),
    prisma.order.count({
      where: { createdAt: { gte: startOfDay }, status: { not: "CANCELLED" } },
    }),
    prisma.order.count({
      where: { createdAt: { gte: startOfWeek }, status: { not: "CANCELLED" } },
    }),
    prisma.order.count({ where: { status: "PAYMENT_APPROVED" } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.product.findMany({
      where: { active: true },
      select: { stock: true, variants: { select: { stock: true } } },
    }),
    prisma.product.count({ where: { brandId: null } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: { select: { name: true } } },
    }),
  ]);

  // Estoque efetivo (regra única do site) só entre os ATIVOS —
  // os importados inativos não contam como "esgotados".
  let lowStock = 0;
  let outOfStock = 0;
  const activeCount = products.length;
  for (const p of products) {
    const s = effectiveStock(p.stock, p.variants);
    if (s === 0) outOfStock++;
    else if (s !== null && s <= 5) lowStock++;
  }

  const monthRevenue = monthAgg._sum.total;
  const monthOrders = monthAgg._count;
  const ticket = monthOrders > 0 ? Number(monthRevenue ?? 0) / monthOrders : 0;

  const salesStats = [
    {
      label: "Faturamento do mês",
      value: fmt(monthRevenue),
      hint: `${monthOrders} pedido${monthOrders === 1 ? "" : "s"} pago${monthOrders === 1 ? "" : "s"}`,
      href: "/admin/pedidos",
    },
    {
      label: "Ticket médio",
      value: monthOrders > 0 ? fmt(ticket) : "—",
      hint: "Pedidos pagos no mês",
      href: "/admin/pedidos",
    },
    {
      label: "Pedidos hoje",
      value: String(todayCount),
      hint: `${weekCount} nos últimos 7 dias`,
      href: "/admin/pedidos",
    },
    {
      label: "A separar",
      value: String(toPick),
      hint:
        pendingCount > 0
          ? `+${pendingCount} aguardando pagamento`
          : "Pagos aguardando preparação",
      href: "/admin/pedidos?status=PAYMENT_APPROVED",
    },
  ];

  const catalogStats = [
    {
      label: "Produtos ativos",
      value: String(activeCount),
      hint: "Visíveis no site",
      href: "/admin/produtos?status=ativo",
    },
    {
      label: "Estoque baixo",
      value: String(lowStock),
      hint: "Ativos com 1–5 unidades",
      href: "/admin/produtos?status=ativo&estoque=baixo",
    },
    {
      label: "Esgotados",
      value: String(outOfStock),
      hint: "Ativos com estoque zero",
      href: "/admin/produtos?status=ativo&estoque=esgotado",
    },
    {
      label: "Sem marca",
      value: String(unbranded),
      hint: "Atribua em Marcas",
      href: "/admin/produtos?marca=sem-marca",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* ============ CABEÇALHO ============ */}
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-gold-dark mb-2">
          Bem-vindo
        </p>
        <h1 className="font-display text-4xl text-noir">
          Olá, <span className="text-gold-dark">{session?.user?.name?.split(" ")[0]}</span>
        </h1>
        <p className="text-neutral-500 mt-2">
          Aqui você gerencia tudo que aparece no site da CB Suplementos.
        </p>
      </header>

      {/* ============ ALERTA DE SEPARAÇÃO ============ */}
      {toPick > 0 && (
        <Link
          href="/gestao/picking"
          className="mb-8 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 hover:bg-amber-100 transition-colors"
        >
          <span>
            📦 <strong>{toPick}</strong> pedido{toPick === 1 ? "" : "s"} pago
            {toPick === 1 ? "" : "s"} aguardando separação.
          </span>
          <span className="font-medium whitespace-nowrap">Abrir fila →</span>
        </Link>
      )}

      {/* ============ VENDAS ============ */}
      <section className="mb-8">
        <h2 className="text-xs uppercase tracking-widest text-neutral-400 mb-3">
          Vendas
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {salesStats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="bg-white p-6 border border-neutral-200 hover:border-gold transition-colors"
            >
              <p className="text-xs uppercase tracking-widest text-gold-dark mb-3">
                {stat.label}
              </p>
              <p className="font-display text-3xl text-noir mb-1">{stat.value}</p>
              <p className="text-xs text-neutral-500">{stat.hint}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ============ CATÁLOGO ============ */}
      <section className="mb-12">
        <h2 className="text-xs uppercase tracking-widest text-neutral-400 mb-3">
          Catálogo
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {catalogStats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="bg-white p-6 border border-neutral-200 hover:border-gold transition-colors"
            >
              <p className="text-xs uppercase tracking-widest text-gold-dark mb-3">
                {stat.label}
              </p>
              <p className="font-display text-3xl text-noir mb-1">{stat.value}</p>
              <p className="text-xs text-neutral-500">{stat.hint}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ============ ÚLTIMOS PEDIDOS ============ */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl text-noir">Últimos pedidos</h2>
          <Link
            href="/admin/pedidos"
            className="text-sm text-amber-600 hover:text-amber-700 font-medium"
          >
            Ver todos →
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="bg-white border border-neutral-200 p-8 text-center text-sm text-neutral-400 rounded-xl">
            Nenhum pedido ainda.
          </div>
        ) : (
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden divide-y divide-neutral-100">
            {recentOrders.map((order) => {
              const s = statusLabels[order.status] ?? statusLabels.PENDING;
              return (
                <Link
                  key={order.id}
                  href={`/admin/pedidos/${order.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-neutral-50"
                >
                  <span className="font-mono text-xs font-medium text-neutral-700 w-28">
                    {order.orderNumber}
                  </span>
                  <span className="flex-1 min-w-[120px] text-sm text-neutral-900 truncate">
                    {order.customer.name}
                  </span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}
                  >
                    {s.label}
                  </span>
                  <span className="text-sm font-medium text-neutral-900 w-24 text-right">
                    {fmt(order.total)}
                  </span>
                  <span className="text-xs text-neutral-400 w-24 text-right">
                    {new Date(order.createdAt).toLocaleDateString("pt-BR")}{" "}
                    {new Date(order.createdAt).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ============ AÇÕES RÁPIDAS ============ */}
      <section>
        <h2 className="font-display text-2xl text-noir mb-6">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ActionCard
            title="Gerenciar Pedidos"
            description="Acompanhar pagamentos, preparar e despachar entregas"
            href="/admin/pedidos"
          />
          <ActionCard
            title="Gerenciar Produtos"
            description="Adicionar, editar ou desativar produtos da vitrine"
            href="/admin/produtos"
          />
          <ActionCard
            title="Gerenciar Marcas"
            description="Criar, renomear e organizar as marcas do catálogo"
            href="/admin/marcas"
          />
          <ActionCard
            title="Gerenciar Categorias"
            description="Organizar as categorias da loja"
            href="/admin/categorias"
          />
          <ActionCard
            title="Gestão de Estoque (celular)"
            description="Vendas de balcão, entradas, separação e histórico — /gestao"
            href="/gestao"
          />
        </div>
      </section>
    </div>
  );
}

/**
 * Componente interno reutilizável para cards de ação
 */
function ActionCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="group bg-white p-6 border border-neutral-200 hover:border-gold transition-colors duration-300"
    >
      <h3 className="font-display text-xl text-noir group-hover:text-gold-dark transition-colors duration-300 mb-2">
        {title} →
      </h3>
      <p className="text-sm text-neutral-500">{description}</p>
    </a>
  );
}

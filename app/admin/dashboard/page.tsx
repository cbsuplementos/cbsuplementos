import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * Dashboard — /admin/dashboard
 *
 * Tela inicial do painel. Mostra:
 * - Saudação personalizada
 * - Cards com totais (produtos, categorias, ativos, destaques)
 * - Atalhos rápidos para ações comuns
 *
 * Server Component — busca dados direto do banco.
 * force-dynamic para evitar erro de build (mesmo motivo da Home).
 */
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();

  // Busca todos os contadores em paralelo (Promise.all = mais rápido)
  const [totalProducts, activeProducts, featuredProducts, totalCategories] =
    await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { active: true } }),
      prisma.product.count({ where: { featured: true, active: true } }),
      prisma.category.count({ where: { active: true } }),
    ]);

  const stats = [
    {
      label: "Produtos Totais",
      value: totalProducts,
      hint: `${activeProducts} ativos`,
    },
    {
      label: "Produtos Ativos",
      value: activeProducts,
      hint: "Visíveis no site",
    },
    {
      label: "Em Destaque",
      value: featuredProducts,
      hint: "Aparecem na Home",
    },
    {
      label: "Categorias",
      value: totalCategories,
      hint: "Categorias ativas",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* ============ CABEÇALHO ============ */}
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-gold-dark mb-2">
          Bem-vindo
        </p>
        <h1 className="font-display text-4xl text-white">
          Olá, <span className="text-gold">{session?.user?.name?.split(" ")[0]}</span>
        </h1>
        <p className="text-cool-gray mt-2">
          Aqui você gerencia tudo que aparece no site da CB Suplementos.
        </p>
      </header>

      {/* ============ CARDS DE ESTATÍSTICAS ============ */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white p-6 border border-gold/10"
          >
            <p className="text-xs uppercase tracking-widest text-gold-dark mb-3">
              {stat.label}
            </p>
            <p className="font-display text-4xl text-noir mb-1">{stat.value}</p>
            <p className="text-xs text-cool-gray">{stat.hint}</p>
          </div>
        ))}
      </section>

      {/* ============ AÇÕES RÁPIDAS ============ */}
      <section>
        <h2 className="font-display text-2xl text-noir mb-6">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ActionCard
            title="Gerenciar Produtos"
            description="Adicionar, editar ou desativar produtos da vitrine"
            href="/admin/produtos"
          />
          <ActionCard
            title="Gerenciar Categorias"
            description="Organizar as categorias da loja"
            href="/admin/categorias"
          />
        </div>
      </section>

      {/* ============ AVISO TEMPORÁRIO ============ */}
      <section className="mt-12 p-6 bg-gold/5 border border-gold/20">
        <h3 className="font-display text-lg text-noir mb-2">
          🚧 Funcionalidades em construção
        </h3>
        <p className="text-sm text-cool-gray leading-relaxed">
          O CRUD completo de produtos e categorias está sendo desenvolvido.
          Por enquanto, você pode visualizar as estatísticas e navegar pelo
          painel.
        </p>
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
      className="group bg-white p-6 border border-gold/10 hover:border-gold transition-colors duration-300"
    >
      <h3 className="font-display text-xl text-noir group-hover:text-gold-dark transition-colors duration-300 mb-2">
        {title} →
      </h3>
      <p className="text-sm text-cool-gray">{description}</p>
    </a>
  );
}
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { PageHeader, Button } from "@/components/admin/FormFields";
import ProductActions from "@/components/admin/ProductActions";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * /admin/produtos
 *
 * Lista todos os produtos com filtros server-side (busca, categoria,
 * status, badge, estoque). Mesmo padrão da tela de Pedidos: estado do
 * filtro vive na URL (querystring), via <form method="GET"> sem JS.
 */

const badgeLabels: Record<string, string> = {
  MAIS_VENDIDO: "Mais Vendido",
  NOVIDADE: "Novidade",
  PROMOCAO: "Promoção",
  EXCLUSIVO: "Exclusivo",
};

interface PageProps {
  searchParams: Promise<{
    q?: string;        // busca por nome/slug
    categoria?: string; // ID da categoria
    status?: string;   // "ativo" | "inativo"
    badge?: string;    // enum ProductBadge
    estoque?: string;  // "baixo" (1-3) | "esgotado" (0)
  }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const categoria = params.categoria || "";
  const status = params.status || "";
  const badge = params.badge || "";
  const estoque = params.estoque || "";

  // Monta o where do Prisma incrementalmente
  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ];
  }
  if (categoria) where.categoryId = categoria;
  if (status === "ativo") where.active = true;
  if (status === "inativo") where.active = false;
  if (badge && badgeLabels[badge]) where.badge = badge;
  if (estoque === "esgotado") where.stock = { lte: 0 };
  if (estoque === "baixo") where.stock = { gt: 0, lte: 3 };

  const hasFilters = !!(q || categoria || status || badge || estoque);

  // Busca produtos filtrados, categorias (para o select) e total — em paralelo
  const [products, categories, allCount] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { category: { select: { name: true } } },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.product.count(),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Produtos"
        description="Gerencie todos os produtos da loja."
        action={
          <Link href="/admin/produtos/novo">
            <Button>+ Novo Produto</Button>
          </Link>
        }
      />

      {/* ====== FILTROS ====== */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 mb-6">
        <form method="GET" className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-neutral-600 mb-1">Buscar</label>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Nome ou slug do produto"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Categoria</label>
            <select name="categoria" defaultValue={categoria}
              className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
              <option value="">Todas</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Status</label>
            <select name="status" defaultValue={status}
              className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
              <option value="">Todos</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Badge</label>
            <select name="badge" defaultValue={badge}
              className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
              <option value="">Todos</option>
              {Object.entries(badgeLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Estoque</label>
            <select name="estoque" defaultValue={estoque}
              className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
              <option value="">Todos</option>
              <option value="baixo">Baixo (1-3)</option>
              <option value="esgotado">Esgotado (0)</option>
            </select>
          </div>
          <button type="submit" className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800">
            Filtrar
          </button>
          {hasFilters && (
            <Link href="/admin/produtos" className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900">
              Limpar
            </Link>
          )}
        </form>
      </div>

      {products.length === 0 ? (
        hasFilters ? (
          <div className="bg-white border border-neutral-200 p-12 text-center rounded-xl">
            <p className="font-display text-2xl text-noir mb-2">Nenhum produto encontrado</p>
            <p className="text-neutral-500 mb-6">Tente ajustar ou limpar os filtros.</p>
            <Link href="/admin/produtos" className="text-amber-600 hover:text-amber-700 font-medium underline">
              Limpar filtros
            </Link>
          </div>
        ) : (
          <EmptyState />
        )
      ) : (
        <div className="bg-white border border-neutral-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-200">
            <p className="text-sm text-neutral-600">
              Mostrando {products.length} de {allCount} produtos
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-noir text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-widest font-medium">
                    Produto
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-widest font-medium">
                    Categoria
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-widest font-medium">
                    Preço
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-widest font-medium">
                    Estoque
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-widest font-medium">
                    Badge
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-widest font-medium">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs uppercase tracking-widest font-medium">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-noir/5">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-14 bg-noir/5 flex-shrink-0">
                          <Image
                            src={product.mainImage}
                            alt={product.name}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-display text-base text-noir truncate">
                            {product.name}
                            {product.featured && (
                              <span className="ml-2 text-xs text-gold-dark">★</span>
                            )}
                          </p>
                          <p className="text-xs text-neutral-500 truncate">
                            /produtos/{product.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-noir">
                      {product.category.name}
                    </td>
                    <td className="px-4 py-4 text-sm text-noir font-medium">
                      {formatPrice(product.price.toString())}
                    </td>
                    <td className="px-4 py-4 text-sm text-noir">
                      {product.stock ?? "—"}
                    </td>
                    <td className="px-4 py-4">
                      {product.badge !== "NONE" ? (
                        <span className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-widest rounded ${
                          product.badge === "MAIS_VENDIDO" ? "bg-amber-100 text-amber-800" :
                          product.badge === "NOVIDADE" ? "bg-emerald-100 text-emerald-800" :
                          product.badge === "PROMOCAO" ? "bg-red-100 text-red-800" :
                          product.badge === "EXCLUSIVO" ? "bg-purple-100 text-purple-800" :
                          "bg-neutral-100 text-neutral-600"
                        }`}>
                          {badgeLabels[product.badge] ?? "—"}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`
                          inline-block px-3 py-1 text-[10px] uppercase tracking-widest
                          ${
                            product.active
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }
                        `}
                      >
                        {product.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <ProductActions
                        id={product.id}
                        active={product.active}
                        featured={product.featured}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white border border-neutral-200 p-12 text-center">
      <p className="font-display text-2xl text-noir mb-2">
        Nenhum produto cadastrado
      </p>
      <p className="text-neutral-500 mb-6">
        Comece adicionando os produtos que aparecerão na vitrine.
      </p>
      <Link href="/admin/produtos/novo">
        <Button>+ Criar Primeiro Produto</Button>
      </Link>
    </div>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader, Button } from "@/components/admin/FormFields";
import { formatPrice } from "@/lib/utils";
import { effectiveStock, startingPrice } from "@/lib/product-stock";
import ProductsTable, {
  type TableRow,
  type HeaderDef,
} from "@/components/admin/ProductsTable";
import Pagination from "@/components/admin/Pagination";

export const dynamic = "force-dynamic";

/**
 * /admin/produtos (E5 + QW7)
 *
 * Filtros, ordenação e página vivem na URL (querystring):
 *  - filtros: form GET (sem JS), como na tela de Pedidos;
 *  - ordenação: cabeçalhos clicáveis (?ordem=&dir=);
 *  - paginação: 25 por página (?pagina=).
 *
 * A ordenação e o corte da página acontecem EM MEMÓRIA de propósito:
 * "Estoque" e "Preço (a partir de)" são calculados a partir das
 * variações (lib/product-stock) e não existem como coluna no banco —
 * ordenar via SQL mostraria uma ordem diferente da que o usuário vê.
 * Com o catálogo atual (~320 produtos) o custo é irrelevante; se um
 * dia passar de alguns milhares, migrar para colunas materializadas.
 */

const PER_PAGE = 25;

const badgeLabels: Record<string, string> = {
  MAIS_VENDIDO: "Mais Vendido",
  NOVIDADE: "Novidade",
  PROMOCAO: "Promoção",
  EXCLUSIVO: "Exclusivo",
};

// Campos ordenáveis e a direção padrão do primeiro clique
const SORTABLE: Record<string, "asc" | "desc"> = {
  nome: "asc",
  categoria: "asc",
  marca: "asc",
  preco: "asc",
  estoque: "asc",
  status: "asc",
  criado: "desc",
};

interface PageProps {
  searchParams: Promise<{
    q?: string;        // busca por nome/slug
    categoria?: string; // ID da categoria
    status?: string;   // "ativo" | "inativo"
    badge?: string;    // enum ProductBadge
    estoque?: string;  // "baixo" (1-5) | "esgotado" (0) | "repor" (<= mínimo)
    marca?: string;    // ID da marca | "sem-marca"
    ordem?: string;    // campo de ordenação
    dir?: string;      // "asc" | "desc"
    pagina?: string;   // página (1-based)
  }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const categoria = params.categoria || "";
  const status = params.status || "";
  const badge = params.badge || "";
  const estoque = params.estoque || "";
  const marca = params.marca || "";
  const ordem = params.ordem && SORTABLE[params.ordem] ? params.ordem : "criado";
  const dir: "asc" | "desc" =
    params.dir === "asc" || params.dir === "desc"
      ? params.dir
      : SORTABLE[ordem];
  const paginaRaw = parseInt(params.pagina ?? "1", 10);

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
  if (marca === "sem-marca") where.brandId = null;
  else if (marca) where.brandId = marca;
  // O filtro de estoque NÃO entra no where: produto com variações tem
  // product.stock = 0/null e o estoque real na soma das variações. Ele é
  // aplicado abaixo, em memória, sobre o estoque efetivo.

  const hasFilters = !!(q || categoria || status || badge || estoque || marca);

  const [products, categories, brands, allCount] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
        variants: { select: { stock: true, price: true, minStock: true, active: true } },
      },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.brand.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.product.count(),
  ]);

  // Estoque efetivo + menor preço (regra única de lib/product-stock)
  const computed = products
    .map((product) => {
      const stock = effectiveStock(product.stock, product.variants);
      const fromPrice = startingPrice(product.price, product.variants);
      // "Repor" (E6): alguma variação ATIVA no mínimo ou abaixo; sem
      // variações, o próprio produto (null = sem controle ⇒ nunca).
      const needsRestock =
        product.variants.length > 0
          ? product.variants.some((v) => v.active && v.stock <= v.minStock)
          : product.stock !== null && product.stock <= product.minStock;
      return {
        product,
        stock,
        fromPrice,
        variantCount: product.variants.length,
        needsRestock,
        // chaves de ordenação pré-calculadas
        sortName: product.name,
        sortCategory: product.category.name,
        sortBrand: product.brand?.name ?? null,
        sortPrice: fromPrice != null ? Number(fromPrice) : Number(product.price),
        sortStock: stock,
        sortActive: product.active ? 1 : 0,
        sortCreated: product.createdAt.getTime(),
      };
    })
    .filter((r) => {
      if (estoque === "esgotado") return r.stock === 0;
      if (estoque === "baixo")
        return r.stock !== null && r.stock > 0 && r.stock <= 5;
      if (estoque === "repor") return r.needsRestock;
      return true;
    });

  // ====== ORDENAÇÃO ======
  const dirMul = dir === "desc" ? -1 : 1;
  computed.sort((a, b) => {
    // nulos sempre no fim, independente da direção
    if (ordem === "marca") {
      if (a.sortBrand === null && b.sortBrand !== null) return 1;
      if (b.sortBrand === null && a.sortBrand !== null) return -1;
    }
    if (ordem === "estoque") {
      if (a.sortStock === null && b.sortStock !== null) return 1;
      if (b.sortStock === null && a.sortStock !== null) return -1;
    }

    let cmp = 0;
    switch (ordem) {
      case "nome":
        cmp = a.sortName.localeCompare(b.sortName, "pt-BR", { sensitivity: "base" });
        break;
      case "categoria":
        cmp = a.sortCategory.localeCompare(b.sortCategory, "pt-BR", { sensitivity: "base" });
        break;
      case "marca":
        cmp = (a.sortBrand ?? "").localeCompare(b.sortBrand ?? "", "pt-BR", { sensitivity: "base" });
        break;
      case "preco":
        cmp = a.sortPrice - b.sortPrice;
        break;
      case "estoque":
        cmp = (a.sortStock ?? 0) - (b.sortStock ?? 0);
        break;
      case "status":
        cmp = a.sortActive - b.sortActive;
        break;
      default:
        cmp = a.sortCreated - b.sortCreated;
    }
    // desempate estável por nome
    if (cmp === 0)
      cmp = a.sortName.localeCompare(b.sortName, "pt-BR", { sensitivity: "base" });
    return dirMul * cmp;
  });

  // ====== PAGINAÇÃO ======
  const totalFiltered = computed.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PER_PAGE));
  const page = Math.min(Math.max(1, Number.isFinite(paginaRaw) ? paginaRaw : 1), totalPages);
  const pageRows = computed.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const allFilteredIds = computed.map((r) => r.product.id);

  // ====== QUERYSTRING (preserva filtros/ordem entre links) ======
  const baseParams: Record<string, string> = {};
  if (q) baseParams.q = q;
  if (categoria) baseParams.categoria = categoria;
  if (status) baseParams.status = status;
  if (badge) baseParams.badge = badge;
  if (estoque) baseParams.estoque = estoque;
  if (marca) baseParams.marca = marca;
  baseParams.ordem = ordem;
  baseParams.dir = dir;

  const qs = (overrides: Record<string, string | null>) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...baseParams, ...overrides })) {
      if (v !== null && v !== "") sp.set(k, v);
    }
    const str = sp.toString();
    return str ? `/admin/produtos?${str}` : "/admin/produtos";
  };

  // ====== CABEÇALHOS ORDENÁVEIS ======
  const columns: { key: string; label: string; sortable: boolean }[] = [
    { key: "nome", label: "Produto", sortable: true },
    { key: "categoria", label: "Categoria", sortable: true },
    { key: "marca", label: "Marca", sortable: true },
    { key: "preco", label: "Preço", sortable: true },
    { key: "estoque", label: "Estoque", sortable: true },
    { key: "badge", label: "Badge", sortable: false },
    { key: "status", label: "Status", sortable: true },
    { key: "acoes", label: "Ações", sortable: false },
  ];
  const headers: HeaderDef[] = columns.map((c) => {
    if (!c.sortable) return { key: c.key, label: c.label, href: "", sorted: null };
    const isActive = ordem === c.key;
    const nextDir = isActive ? (dir === "asc" ? "desc" : "asc") : SORTABLE[c.key];
    return {
      key: c.key,
      label: c.label,
      href: qs({ ordem: c.key, dir: nextDir, pagina: null }),
      sorted: isActive ? dir : null,
    };
  });

  // ====== LINHAS SERIALIZADAS PARA O CLIENT ======
  const tableRows: TableRow[] = pageRows.map((r) => ({
    id: r.product.id,
    name: r.product.name,
    slug: r.product.slug,
    mainImage: r.product.mainImage,
    categoryName: r.product.category.name,
    brandName: r.product.brand?.name ?? null,
    priceLabel:
      r.fromPrice != null
        ? formatPrice(String(r.fromPrice))
        : formatPrice(r.product.price.toString()),
    hasVariants: r.variantCount > 0,
    variantCount: r.variantCount,
    stock: r.stock,
    needsRestock: r.needsRestock,
    badge: r.product.badge,
    active: r.product.active,
    featured: r.product.featured,
  }));

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
          {/* preserva a ordenação atual ao filtrar (a página volta pra 1) */}
          <input type="hidden" name="ordem" value={ordem} />
          <input type="hidden" name="dir" value={dir} />
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-neutral-600 mb-1">Buscar</label>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Nome ou slug do produto"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Categoria</label>
            <select name="categoria" defaultValue={categoria}
              className="px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500">
              <option value="">Todas</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Marca</label>
            <select name="marca" defaultValue={marca}
              className="px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500">
              <option value="">Todas</option>
              <option value="sem-marca">Sem marca</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Status</label>
            <select name="status" defaultValue={status}
              className="px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500">
              <option value="">Todos</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Badge</label>
            <select name="badge" defaultValue={badge}
              className="px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500">
              <option value="">Todos</option>
              {Object.entries(badgeLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Estoque</label>
            <select name="estoque" defaultValue={estoque}
              className="px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500">
              <option value="">Todos</option>
              <option value="baixo">Baixo (1-5)</option>
              <option value="esgotado">Esgotado (0)</option>
              <option value="repor">Abaixo do mínimo (Repor)</option>
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

      {tableRows.length === 0 ? (
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
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          {hasFilters && (
            <div className="px-4 py-2 border-b border-neutral-200 bg-neutral-50">
              <p className="text-xs text-neutral-500">
                Filtro ativo — {totalFiltered} de {allCount} produtos no total.
              </p>
            </div>
          )}
          <ProductsTable
            rows={tableRows}
            headers={headers}
            allFilteredIds={allFilteredIds}
            categories={categories}
            brands={brands}
          />
          <Pagination
            total={totalFiltered}
            page={page}
            perPage={PER_PAGE}
            hrefFor={(p) => qs({ pagina: p === 1 ? null : String(p) })}
            labelSingular="produto"
            labelPlural="produtos"
          />
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

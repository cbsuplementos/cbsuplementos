import { Metadata } from "next";
import { prisma } from "@/lib/db";
import { Suspense } from "react";
import ProductCard from "@/components/produtos/ProductCard";
import CategoryFilter from "@/components/produtos/CategoryFilter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Produtos | CB Suplementos",
  description:
    "Catálogo completo: Whey Protein, Creatina, Pré-Treino, BCAA, Termogênicos e mais. Produtos 100% originais com entrega para todo Brasil.",
  openGraph: {
    title: "Produtos | CB Suplementos",
    description: "Catálogo completo de suplementos esportivos originais.",
  },
};

/**
 * /produtos — Listagem de produtos com filtro por categoria
 *
 * Filtro via searchParams (?categoria=vestidos):
 * - URL compartilhável (cliente manda link filtrado pelo WhatsApp)
 * - Server Component busca direto no Prisma (sem API intermediária)
 * - Filtro no banco = rápido (índice @@index([categoryId, active]))
 *
 * Grid responsivo:
 * - Mobile: 2 colunas (cards compactos)
 * - Tablet: 3 colunas
 * - Desktop: 4 colunas
 */
interface PageProps {
  searchParams: Promise<{ categoria?: string }>;
}

export default async function ProdutosPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const categoriaSlug = params.categoria || "";

  // Busca categorias para o filtro (com contagem de produtos ativos)
  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    include: {
      _count: {
        select: {
          products: {
            where: { active: true },
          },
        },
      },
    },
  });

  // Busca produtos (filtrados ou todos)
  const products = await prisma.product.findMany({
    where: {
      active: true,
      ...(categoriaSlug
        ? { category: { slug: categoriaSlug } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      category: {
        select: { name: true },
      },
    },
  });

  // Nome da categoria ativa (para o título dinâmico)
  const activeCategory = categoriaSlug
    ? categories.find((c) => c.slug === categoriaSlug)
    : null;

  return (
    <section className="min-h-screen bg-neutral-50">
      {/* Header da página */}
      <div className="bg-neutral-900 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display">
            {activeCategory ? activeCategory.name : "Nossos Produtos"}
          </h1>
          <p className="mt-3 text-neutral-300 text-base sm:text-lg max-w-2xl mx-auto">
            {activeCategory
              ? `Confira nossa seleção de ${activeCategory.name.toLowerCase()}`
              : "Suplementos originais para todos os objetivos"}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Barra de filtro + contagem */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <p className="text-sm text-neutral-500">
            {products.length} {products.length === 1 ? "produto encontrado" : "produtos encontrados"}
          </p>

          <Suspense fallback={<div className="h-12 w-64 bg-neutral-200 rounded-lg animate-pulse" />}>
            <CategoryFilter categories={categories} />
          </Suspense>
        </div>

        {/* Grid de produtos */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  slug: product.slug,
                  name: product.name,
                  price: product.price.toString(),
                  mainImage: product.mainImage,
                  stock: product.stock,
                  badge: product.badge,
                  category: product.category,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-neutral-400 text-lg">
              Nenhum produto encontrado nesta categoria.
            </p>
            <a
              href="/produtos"
              className="mt-4 inline-block text-amber-600 hover:text-amber-700 font-medium underline"
            >
              Ver todos os produtos
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

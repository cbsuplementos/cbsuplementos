import Link from "next/link";
import { prisma } from "@/lib/db";
import ProductCard from "./ProductCard";

export default async function FeaturedProducts() {
  let products = await prisma.product.findMany({
    where: { active: true, featured: true },
    take: 4,
    orderBy: { createdAt: "desc" },
    include: { category: { select: { name: true } } },
  });

  if (products.length === 0) {
    products = await prisma.product.findMany({
      where: { active: true },
      take: 4,
      orderBy: { createdAt: "desc" },
      include: { category: { select: { name: true } } },
    });
  }

  if (products.length === 0) return null;

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-noir">
      <div className="container-padded">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-8 sm:mb-10 lg:mb-14">
          <div>
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-gold mb-3">
              Destaques
            </p>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight">
              Os mais <span className="text-gold">vendidos</span>
            </h2>
          </div>
          <Link
            href="/produtos"
            className="text-xs uppercase tracking-widest text-white border-b border-gold pb-0.5 hover:text-gold transition-colors duration-300 self-start sm:self-auto"
          >
            Ver Todos →
          </Link>
        </div>

        {/* Grid — 2 colunas no mobile, 4 no desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-8 sm:gap-x-4 sm:gap-y-10 lg:gap-x-6">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={{
                id: product.id,
                name: product.name,
                slug: product.slug,
                price: product.price.toString(),
                mainImage: product.mainImage,
                stock: product.stock,
                badge: product.badge,
                category: product.category,
              }}
              priority={index < 2}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

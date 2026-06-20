import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";

/**
 * CategoryGrid — Mobile-first
 *
 * Mobile: 2 colunas, cards menores, texto compacto
 * Tablet (sm): 2 colunas maiores
 * Desktop (lg): 4 colunas
 */
export default async function CategoryGrid() {
  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    take: 4,
    include: {
      _count: { select: { products: { where: { active: true } } } },
    },
  });

  if (categories.length === 0) return null;

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-graphite">
      <div className="container-padded">
        {/* Cabeçalho */}
        <div className="text-center mb-8 sm:mb-10 lg:mb-14">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-gold mb-3">
            Categorias
          </p>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white mb-3 tracking-tight">
            Encontre o seu <span className="text-gold">suplemento</span>
          </h2>
          <p className="text-sm sm:text-base text-cool-gray max-w-sm sm:max-w-md mx-auto">
            Produtos selecionados para cada objetivo de treino.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/produtos?categoria=${category.slug}`}
              className="group relative aspect-[3/4] overflow-hidden bg-noir"
            >
              {category.image ? (
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-noir to-gold-dark/40" />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-noir/90 via-noir/20 to-transparent" />

              <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-4 lg:p-6 text-white">
                <h3 className="font-display text-lg sm:text-xl lg:text-2xl mb-0.5 group-hover:text-gold transition-colors duration-300 leading-tight">
                  {category.name}
                </h3>
                <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-gold-light">
                  {category._count.products}{" "}
                  {category._count.products === 1 ? "produto" : "produtos"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

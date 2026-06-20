import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

// Mapa de badges com label e cor
const BADGE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  MAIS_VENDIDO: { label: "Mais Vendido", bg: "bg-gold", text: "text-noir" },
  NOVIDADE: { label: "Novidade", bg: "bg-emerald-500", text: "text-white" },
  PROMOCAO: { label: "Promoção", bg: "bg-red-500", text: "text-white" },
  EXCLUSIVO: { label: "Exclusivo", bg: "bg-purple-600", text: "text-white" },
};

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number | string;
    mainImage: string;
    stock?: number | null;
    badge?: string | null;
    category: { name: string };
  };
  priority?: boolean;
}

/**
 * ProductCard — Mobile-first (Home / FeaturedProducts)
 *
 * Agora com:
 * - Badge do produto (Mais Vendido, Novidade, Promoção, Exclusivo)
 * - Urgência de estoque baixo
 */
export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock !== null && product.stock !== undefined && product.stock > 0 && product.stock <= 3;
  const badgeInfo = product.badge && product.badge !== "NONE" ? BADGE_CONFIG[product.badge] : null;

  return (
    <Link href={`/produtos/${product.slug}`} className="group block">
      {/* Imagem */}
      <div className="relative aspect-[3/4] overflow-hidden bg-graphite mb-2 sm:mb-3">
        <Image
          src={product.mainImage}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={priority}
          className={`object-cover transition-transform duration-700 group-hover:scale-105 ${isOutOfStock ? "opacity-60" : ""}`}
        />

        {/* Badges empilhados */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
          {badgeInfo && !isOutOfStock && (
            <span className={`${badgeInfo.bg} ${badgeInfo.text} text-[9px] sm:text-[10px] uppercase tracking-wider font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded shadow-sm`}>
              {badgeInfo.label}
            </span>
          )}

          {isOutOfStock && (
            <span className="bg-noir border border-white/20 text-white text-[9px] sm:text-[10px] uppercase tracking-wider font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
              Esgotado
            </span>
          )}

          {isLowStock && (
            <span className="bg-gold/20 text-gold-light border border-gold/40 text-[9px] sm:text-[10px] uppercase tracking-wider font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded shadow-sm">
              ⚡ Últimas {product.stock}
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="space-y-0.5 sm:space-y-1">
        <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-gold">
          {product.category.name}
        </p>
        <h3 className="font-display text-sm sm:text-base lg:text-lg text-white group-hover:text-gold transition-colors duration-300 leading-tight">
          {product.name}
        </h3>
        <p className="text-xs sm:text-sm font-medium text-gold">
          {formatPrice(product.price)}
        </p>
      </div>
    </Link>
  );
}

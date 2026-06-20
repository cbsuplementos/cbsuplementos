import Link from "next/link";
import Image from "next/image";

// Mapa de badges com label e cor
const BADGE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  MAIS_VENDIDO: { label: "Mais Vendido", bg: "bg-amber-500", text: "text-white" },
  NOVIDADE: { label: "Novidade", bg: "bg-emerald-500", text: "text-white" },
  PROMOCAO: { label: "Promoção", bg: "bg-red-500", text: "text-white" },
  EXCLUSIVO: { label: "Exclusivo", bg: "bg-purple-600", text: "text-white" },
};

interface ProductCardProps {
  product: {
    slug: string;
    name: string;
    price: string | number;
    mainImage: string;
    stock?: number | null;
    badge?: string | null;
    category?: {
      name: string;
    };
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(product.price));

  // Esgotado: stock é 0 (não null — null significa sem controle de estoque)
  const isOutOfStock = product.stock === 0;
  // Urgência: estoque baixo (1-3 unidades)
  const isLowStock = product.stock !== null && product.stock !== undefined && product.stock > 0 && product.stock <= 3;
  // Badge do produto (configurável pelo admin)
  const badgeInfo = product.badge && product.badge !== "NONE" ? BADGE_CONFIG[product.badge] : null;

  return (
    <Link
      href={`/produtos/${product.slug}`}
      className="group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
    >
      {/* Imagem com aspect ratio fixo */}
      <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
        <Image
          src={product.mainImage}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-cover transition-transform duration-700 group-hover:scale-105 ${isOutOfStock ? "opacity-60" : ""}`}
        />

        {/* Badges empilhados no canto superior esquerdo */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
          {/* Badge de status do produto (admin define) */}
          {badgeInfo && !isOutOfStock && (
            <span className={`${badgeInfo.bg} ${badgeInfo.text} text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded shadow-sm`}>
              {badgeInfo.label}
            </span>
          )}

          {/* Tag "Esgotado" */}
          {isOutOfStock && (
            <span className="bg-neutral-900 text-white text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded">
              Esgotado
            </span>
          )}

          {/* Urgência de estoque baixo */}
          {isLowStock && (
            <span className="bg-amber-100 text-amber-800 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded shadow-sm">
              ⚡ Últimas {product.stock} un.
            </span>
          )}
        </div>

        {/* Overlay sutil no hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
      </div>

      {/* Informações do produto */}
      <div className="p-3 sm:p-4">
        {product.category && (
          <span className="text-xs uppercase tracking-wider text-amber-600 font-medium">
            {product.category.name}
          </span>
        )}

        <h3 className="mt-1 text-sm sm:text-base font-medium text-neutral-900 line-clamp-2 group-hover:text-amber-700 transition-colors">
          {product.name}
        </h3>

        <p className="mt-2 text-base sm:text-lg font-semibold text-neutral-900">
          {formattedPrice}
        </p>
      </div>
    </Link>
  );
}

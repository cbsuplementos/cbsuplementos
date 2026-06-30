import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import ImageGallery from "@/components/produtos/ImageGallery";
import VariantSelector from "@/components/produtos/VariantSelector";
import WhatsAppProductButton from "@/components/produtos/WhatsAppProductButton";
import AddToCartButton from "@/components/produtos/AddToCartButton";
import BuyNowButton from "@/components/produtos/BuyNowButton";

/**
 * /produtos/[slug] — Página de detalhe do produto
 *
 * Essa é a página que VENDE. O cliente chega aqui pelo Google,
 * Instagram, ou link no WhatsApp e precisa:
 * 1. Ver o produto claramente (galeria de imagens)
 * 2. Entender o que está comprando (descrição + variantes)
 * 3. Agir (botão WhatsApp com mensagem pré-preenchida)
 *
 * SEO:
 * - generateMetadata dinâmico (título, descrição, og:image por produto)
 * - Schema.org Product (structured data) para rich snippets no Google
 *
 * Performance:
 * - force-dynamic pra garantir dados frescos do banco
 * - Imagem principal com priority (LCP)
 */

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// SEO — Metadata dinâmica por produto
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug, active: true },
    select: { name: true, description: true, mainImage: true },
  });

  if (!product) {
    return { title: "Produto não encontrado | CB Suplementos" };
  }

  return {
    title: `${product.name} | CB Suplementos`,
    description: product.description.substring(0, 160),
    openGraph: {
      title: `${product.name} | CB Suplementos`,
      description: product.description.substring(0, 160),
      images: [{ url: product.mainImage, width: 800, height: 1067 }],
      type: "website",
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug, active: true },
    include: {
      category: { select: { name: true, slug: true } },
      images: { orderBy: { order: "asc" } },
      variants: {
        where: { active: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!product) {
    notFound();
  }

  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(product.price));

  const hasVariants = product.variants.length > 0;

  // Schema.org structured data — ajuda o Google a entender que é um produto
  const isOutOfStock = product.stock === 0;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.mainImage,
    offers: {
      "@type": "Offer",
      price: Number(product.price),
      priceCurrency: "BRL",
      availability: isOutOfStock
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "CB Suplementos",
      },
    },
  };

  return (
    <>
      {/* Structured Data (invisível — só pro Google) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="min-h-screen bg-noir">
        {/* Breadcrumb */}
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <ol className="flex items-center gap-2 text-sm text-cool-gray">
            <li>
              <Link href="/" className="hover:text-gold transition-colors">
                Início
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/produtos" className="hover:text-gold transition-colors">
                Produtos
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link
                href={`/produtos?categoria=${product.category.slug}`}
                className="hover:text-gold transition-colors"
              >
                {product.category.name}
              </Link>
            </li>
            <li>/</li>
            <li className="text-white font-medium truncate max-w-[200px]">
              {product.name}
            </li>
          </ol>
        </nav>

        {/* Conteúdo principal — 2 colunas no desktop */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Coluna esquerda — Galeria */}
            <ImageGallery
              mainImage={product.mainImage}
              productName={product.name}
              images={product.images.map((img) => ({
                url: img.url,
                alt: img.alt || product.name,
              }))}
            />

            {/* Coluna direita — Informações */}
            <div className="flex flex-col">
              {/* Badge + Categoria */}
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/produtos?categoria=${product.category.slug}`}
                  className="text-sm uppercase tracking-wider text-gold font-medium hover:text-gold-light transition-colors w-fit"
                >
                  {product.category.name}
                </Link>
                {product.badge && product.badge !== "NONE" && (() => {
                  const badges: Record<string, { label: string; bg: string; text: string }> = {
                    MAIS_VENDIDO: { label: "Mais Vendido", bg: "bg-gold", text: "text-noir" },
                    NOVIDADE: { label: "Novidade", bg: "bg-emerald-500", text: "text-white" },
                    PROMOCAO: { label: "Promoção", bg: "bg-red-500", text: "text-white" },
                    EXCLUSIVO: { label: "Exclusivo", bg: "bg-purple-600", text: "text-white" },
                  };
                  const b = badges[product.badge];
                  return b ? (
                    <span className={`${b.bg} ${b.text} text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded`}>
                      {b.label}
                    </span>
                  ) : null;
                })()}
              </div>

              {/* Nome do produto */}
              <h1 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold text-white font-display">
                {product.name}
              </h1>

              {/* Preço ou seletor de variantes */}
              <div className="mt-6">
                {hasVariants ? (
                  <VariantSelector
                    variants={product.variants.map((v) => ({
                      id: v.id,
                      name: v.name,
                      price: v.price.toString(),
                      stock: v.stock,
                      active: v.active,
                      attributes: v.attributes as Record<string, string> | null,
                    }))}
                    basePrice={product.price.toString()}
                  />
                ) : (
                  <p className="text-2xl sm:text-3xl font-bold text-white">
                    {formattedPrice}
                  </p>
                )}
              </div>

              {/* Descrição */}
              <div className="mt-8">
                <h2 className="text-sm font-medium text-cool-gray uppercase tracking-wider mb-3">
                  Descrição
                </h2>
                <div className="prose prose-neutral prose-sm sm:prose-base max-w-none">
                  {product.description.split("\n").map((paragraph, i) => (
                    <p key={i} className="text-white/80 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              {/* Botões de ação — CTA principal */}
              <div className="mt-8 sticky bottom-4 lg:static space-y-3">
                <AddToCartButton
                  productId={product.id}
                  stock={product.stock}
                  hasVariants={hasVariants}
                />
                <BuyNowButton
                  productId={product.id}
                  stock={product.stock}
                  hasVariants={hasVariants}
                />
                <WhatsAppProductButton
                  productName={product.name}
                  productSlug={product.slug}
                />
              </div>

              {/* Info extra */}
              <div className="mt-8 pt-6 border-t border-gold/15 space-y-3">
                <div className="flex items-center gap-3 text-sm text-cool-gray">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  </svg>
                  Produto 100% original com nota fiscal
                </div>
                <div className="flex items-center gap-3 text-sm text-cool-gray">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="M6 8h.001M10 8h.001" />
                    <path d="M2 12h20" />
                  </svg>
                  Pix, cartão em até 12x e boleto
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

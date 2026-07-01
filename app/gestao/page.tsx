import { prisma } from "@/lib/db";
import { ProductList, type ProductRow } from "./ProductList";

export const dynamic = "force-dynamic";

export default async function GestaoHome() {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      mainImage: true,
      stock: true,
      active: true,
      price: true,
      resalePrice: true,
      brand: { select: { name: true } },
      variants: {
        select: { id: true, stock: true, resalePrice: true, price: true },
      },
    },
  });

  const rows: ProductRow[] = products.map((p) => {
    const hasVariants = p.variants.length > 0;
    const totalStock = hasVariants
      ? p.variants.reduce((sum, v) => sum + v.stock, 0)
      : p.stock ?? 0;

    // preço de revenda "a partir de" (menor entre as variantes / produto)
    const resaleCandidates = hasVariants
      ? p.variants.map((v) => Number(v.resalePrice ?? v.price))
      : [Number(p.resalePrice ?? p.price)];
    const fromResale = Math.min(...resaleCandidates.filter((n) => !Number.isNaN(n)));

    return {
      id: p.id,
      name: p.name,
      image: p.mainImage || null,
      brand: p.brand?.name ?? null,
      active: p.active,
      totalStock,
      variantCount: p.variants.length,
      fromResale: Number.isFinite(fromResale) ? fromResale : null,
    };
  });

  return <ProductList rows={rows} />;
}

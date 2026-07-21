import { prisma } from "@/lib/db";
import Link from "next/link";
import { ProductList, type ProductRow } from "./ProductList";

export const dynamic = "force-dynamic";

export default async function GestaoHome() {
  const pickingCount = await prisma.order.count({
    where: { status: "PAYMENT_APPROVED" },
  });

  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      mainImage: true,
      stock: true,
      active: true,
      price: true,
      minStock: true,
      brand: { select: { name: true } },
      variants: {
        select: { id: true, stock: true, price: true, minStock: true, active: true },
      },
    },
  });

  const rows: ProductRow[] = products.map((p) => {
    const hasVariants = p.variants.length > 0;
    const totalStock = hasVariants
      ? p.variants.reduce((sum, v) => sum + v.stock, 0)
      : p.stock ?? 0;

    // preço de venda "a partir de" (menor entre as variações / produto).
    // Fonte única: `price` — é o que o site cobra (revenda == preço do site,
    // decisão de 02/07; `resalePrice` virou espelho legado).
    // "Repor" (E6): alguma variação ATIVA no mínimo ou abaixo; sem
    // variações, o próprio produto (null = sem controle => nunca).
    const needsRestock = hasVariants
      ? p.variants.some((v) => v.active && v.stock <= v.minStock)
      : p.stock !== null && p.stock <= p.minStock;

    const priceCandidates = hasVariants
      ? p.variants.map((v) => Number(v.price))
      : [Number(p.price)];
    const fromPrice = Math.min(...priceCandidates.filter((n) => !Number.isNaN(n)));

    return {
      id: p.id,
      name: p.name,
      image: p.mainImage || null,
      brand: p.brand?.name ?? null,
      active: p.active,
      totalStock,
      needsRestock,
      variantCount: p.variants.length,
      fromPrice: Number.isFinite(fromPrice) ? fromPrice : null,
    };
  });

  return (
    <>
      <Link
        href="/gestao/picking"
        className="mb-3 flex items-center gap-3 rounded-xl border border-gold/20 bg-gold/5 p-3 transition active:scale-[0.99]"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-sans text-sm font-medium text-white">Separação de pedidos</p>
          <p className="font-sans text-xs text-cool-gray">Pedidos pagos aguardando preparação</p>
        </div>
        {pickingCount > 0 && (
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-gold px-2 font-sans text-xs font-bold text-noir">
            {pickingCount}
          </span>
        )}
        <svg className="h-5 w-5 text-cool-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </Link>

      <Link
        href="/gestao/entrada-nota"
        className="mb-3 flex items-center gap-3 rounded-xl border border-gold/20 bg-gold/5 p-3 transition active:scale-[0.99]"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-sans text-sm font-medium text-white">Entrada por nota</p>
          <p className="font-sans text-xs text-cool-gray">Fotografe a nota e dê entrada no estoque</p>
        </div>
        <svg className="h-5 w-5 text-cool-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </Link>
      <ProductList rows={rows} />
    </>
  );
}

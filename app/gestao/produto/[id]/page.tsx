import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { brl } from "../../lib";
import { StockPill } from "../../StockPill";
import { StockPanel, type PanelVariant } from "./StockPanel";
import { MovementHistory } from "./MovementHistory";

export const dynamic = "force-dynamic";

export default async function ProdutoDetalhe({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      mainImage: true,
      stock: true,
      active: true,
      price: true,
      costPrice: true,
      resalePrice: true,
      brand: { select: { name: true } },
      category: { select: { name: true } },
      variants: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          stock: true,
          price: true,
          costPrice: true,
          resalePrice: true,
          attributes: true,
        },
      },
    },
  });

  if (!product) notFound();

  const hasVariants = product.variants.length > 0;
  const totalStock = hasVariants
    ? product.variants.reduce((s, v) => s + v.stock, 0)
    : product.stock ?? 0;

  const panelVariants: PanelVariant[] = hasVariants
    ? product.variants.map((v) => ({
        id: v.id,
        name: v.name,
        stock: v.stock,
        cost: v.costPrice != null ? Number(v.costPrice) : null,
        resale: v.resalePrice != null ? Number(v.resalePrice) : Number(v.price),
      }))
    : [
        {
          id: null,
          name: "Produto",
          stock: product.stock ?? 0,
          cost: product.costPrice != null ? Number(product.costPrice) : null,
          resale: product.resalePrice != null ? Number(product.resalePrice) : Number(product.price),
        },
      ];

  const movements = await prisma.stockMovement.findMany({
    where: { productId: id },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: {
      id: true,
      type: true,
      quantity: true,
      stockAfter: true,
      reason: true,
      reference: true,
      createdAt: true,
      variant: { select: { name: true } },
    },
  });

  return (
    <div>
      {/* Voltar */}
      <Link
        href="/gestao"
        className="mb-3 inline-flex items-center gap-1.5 font-sans text-sm text-cool-gray transition active:text-white"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Voltar
      </Link>

      {/* Cabeçalho do produto */}
      <div className="flex gap-3">
        {product.mainImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.mainImage}
            alt={product.name}
            className="h-24 w-24 shrink-0 rounded-xl border border-white/10 object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-charcoal">
            <span className="font-sans text-[10px] uppercase tracking-wide text-cool-gray">
              sem foto
            </span>
          </div>
        )}

        <div className="min-w-0 flex-1">
          {product.brand?.name && (
            <div className="font-sans text-xs font-semibold uppercase tracking-wide text-gold/80">
              {product.brand.name}
            </div>
          )}
          <h1 className="mt-1 font-sans !text-lg !font-semibold !normal-case !tracking-normal leading-tight text-white">
            {product.name}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <StockPill qty={totalStock} size="sm" />
            <span className="font-sans text-xs text-cool-gray">
              {product.category?.name ?? "Sem categoria"}
            </span>
            {!product.active && (
              <span className="rounded bg-white/10 px-1.5 py-0.5 font-sans text-[10px] uppercase tracking-wide text-cool-gray">
                inativo no site
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Painel de operações + tabela de variantes */}
      <StockPanel productId={product.id} variants={panelVariants} hasVariants={hasVariants} />

      {/* Histórico */}
      <MovementHistory movements={movements.map((m) => ({
        id: m.id,
        type: m.type,
        quantity: m.quantity,
        stockAfter: m.stockAfter,
        reason: m.reason,
        reference: m.reference,
        variantName: m.variant?.name ?? null,
        createdAt: m.createdAt.toISOString(),
      }))} />
    </div>
  );
}

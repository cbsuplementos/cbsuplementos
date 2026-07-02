import Link from "next/link";
import { prisma } from "@/lib/db";
import { buildCatalogEntry, type CatalogEntry } from "@/lib/note-match";
import { NoteEntry } from "./NoteEntry";

export const dynamic = "force-dynamic";

export default async function EntradaNotaPage() {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      brand: { select: { name: true } },
      variants: { select: { id: true, name: true, attributes: true } },
    },
  });

  const catalog: CatalogEntry[] = [];
  for (const p of products) {
    const brand = p.brand?.name ?? null;
    if (p.variants.length === 0) {
      catalog.push(buildCatalogEntry(p.id, null, p.name, null, null, brand));
    } else {
      for (const v of p.variants) {
        catalog.push(
          buildCatalogEntry(
            p.id,
            v.id,
            p.name,
            v.name,
            (v.attributes as Record<string, unknown> | null) ?? null,
            brand
          )
        );
      }
    }
  }

  const aliasRows = await prisma.noteItemAlias.findMany({
    select: { supplierCode: true, productId: true, variantId: true },
  });
  // um alias só é útil se apontar para um produto real
  const aliases = aliasRows.filter(
    (a): a is { supplierCode: string; productId: string; variantId: string | null } =>
      a.productId != null
  );

  return (
    <div>
      <Link
        href="/gestao"
        className="mb-3 inline-flex items-center gap-1.5 font-sans text-sm text-cool-gray transition active:text-white"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Voltar
      </Link>

      <h1 className="font-display text-2xl tracking-wide text-gold">Entrada por nota</h1>
      <p className="mt-1 font-sans text-sm text-cool-gray">
        Fotografe a nota, confira os itens e dê entrada no estoque de uma vez.
      </p>

      <NoteEntry catalog={catalog} aliases={aliases} />
    </div>
  );
}

import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/admin/FormFields";
import BrandManager from "./BrandManager";

export const dynamic = "force-dynamic";

/**
 * /admin/marcas — CRUD leve de marcas (E1)
 *
 * A marca é usada como filtro no site, no admin e no app de Gestão.
 * Renomear aqui atualiza todos os produtos vinculados de uma vez.
 */
export default async function BrandsPage() {
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      active: true,
      _count: { select: { products: true } },
    },
  });

  const semMarca = await prisma.product.count({ where: { brandId: null } });

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Marcas"
        description="Gerencie as marcas dos produtos. Renomear uma marca atualiza todos os produtos dela."
      />

      <BrandManager
        brands={brands.map((b) => ({
          id: b.id,
          name: b.name,
          active: b.active,
          productCount: b._count.products,
        }))}
        unbrandedCount={semMarca}
      />
    </div>
  );
}

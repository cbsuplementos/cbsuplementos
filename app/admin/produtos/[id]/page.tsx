import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/admin/FormFields";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, categories, brands] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: "asc" } },
        variants: { orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.category.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      select: { id: true, name: true },
    }),
    prisma.brand.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Editar Produto"
        description={`Editando: ${product.name}`}
      />
      <ProductForm
        categories={categories}
        brands={brands}
        product={{
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price.toString(),
          costPrice: product.costPrice?.toString() ?? "",
          brandId: product.brandId ?? "",
          minStock: product.minStock,
          mainImage: product.mainImage,
          categoryId: product.categoryId,
          stock: product.stock,
          badge: product.badge,
          active: product.active,
          featured: product.featured,
          images: product.images.map((img) => ({
            url: img.url,
            order: img.order,
          })),
          variants: product.variants.map((v) => ({
            id: v.id,
            name: v.name,
            price: v.price.toString(),
            costPrice: v.costPrice?.toString() ?? "",
            stock: v.stock,
            minStock: v.minStock,
            sku: v.sku || "",
            active: v.active,
          })),
        }}
      />
    </div>
  );
}

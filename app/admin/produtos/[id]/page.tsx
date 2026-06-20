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

  const [product, categories] = await Promise.all([
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
        product={{
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price.toString(),
          mainImage: product.mainImage,
          categoryId: product.categoryId,
          stock: product.stock,
          badge: product.badge,
          weight: product.weight,
          height: product.height,
          width: product.width,
          length: product.length,
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
            stock: v.stock,
            sku: v.sku || "",
            active: v.active,
          })),
        }}
      />
    </div>
  );
}

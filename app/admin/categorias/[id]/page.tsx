import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/admin/FormFields";
import CategoryForm from "@/components/admin/CategoryForm";

export const dynamic = "force-dynamic";

/**
 * /admin/categorias/[id]
 *
 * Página de edição de categoria existente.
 * Se o ID não existir, retorna 404.
 */
export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Editar Categoria"
        description={`Editando: ${category.name}`}
      />
      <CategoryForm
        category={{
          id: category.id,
          name: category.name,
          description: category.description,
          image: category.image,
          order: category.order,
          defaultWeight: category.defaultWeight,
          defaultHeight: category.defaultHeight,
          defaultWidth: category.defaultWidth,
          defaultLength: category.defaultLength,
        }}
      />
    </div>
  );
}

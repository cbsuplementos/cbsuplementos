import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader, Button } from "@/components/admin/FormFields";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    select: { id: true, name: true },
  });

  // Se não tem categorias, exige criar uma primeiro
  if (categories.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <PageHeader
          title="Novo Produto"
          description="Adicione um novo produto à vitrine."
        />
        <div className="bg-white border border-gold/10 p-12 text-center">
          <p className="font-display text-xl text-noir mb-2">
            Crie uma categoria primeiro
          </p>
          <p className="text-cool-gray mb-6">
            Antes de cadastrar produtos, você precisa ter pelo menos uma categoria ativa.
          </p>
          <Link href="/admin/categorias/nova">
            <Button>Criar Categoria</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Novo Produto"
        description="Adicione um novo produto à vitrine."
      />
      <ProductForm categories={categories} />
    </div>
  );
}

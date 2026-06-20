import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { PageHeader, Button } from "@/components/admin/FormFields";
import CategoryActions from "@/components/admin/CategoryActions";

export const dynamic = "force-dynamic";

/**
 * /admin/categorias
 *
 * Lista todas as categorias com:
 * - Imagem (se houver)
 * - Nome e descrição
 * - Contagem de produtos
 * - Status (ativa/inativa)
 * - Ações: editar, ativar/desativar, deletar
 */
export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { products: true } },
    },
  });

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Categorias"
        description="Organize os produtos da loja em categorias."
        action={
          <Link href="/admin/categorias/nova">
            <Button>+ Nova Categoria</Button>
          </Link>
        }
      />

      {categories.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="bg-white border border-neutral-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-noir text-white">
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-widest font-medium">
                  Categoria
                </th>
                <th className="hidden sm:table-cell px-4 py-3 text-left text-xs uppercase tracking-widest font-medium">
                  Produtos
                </th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs uppercase tracking-widest font-medium">
                  Ordem
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-widest font-medium">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs uppercase tracking-widest font-medium">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-noir/5">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 bg-noir/5 flex-shrink-0">
                        {category.image ? (
                          <Image
                            src={category.image}
                            alt={category.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-noir/20">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-display text-lg text-noir truncate">
                          {category.name}
                        </p>
                        <p className="text-xs text-neutral-500 truncate">
                          /{category.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-4 text-sm text-noir">
                    {category._count.products}
                  </td>
                  <td className="hidden md:table-cell px-4 py-4 text-sm text-noir">
                    {category.order}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`
                        inline-block px-3 py-1 text-[10px] uppercase tracking-widest
                        ${
                          category.active
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }
                      `}
                    >
                      {category.active ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <CategoryActions
                      id={category.id}
                      active={category.active}
                      hasProducts={category._count.products > 0}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white border border-neutral-200 p-12 text-center">
      <p className="font-display text-2xl text-noir mb-2">
        Nenhuma categoria cadastrada
      </p>
      <p className="text-neutral-500 mb-6">
        Comece criando categorias para organizar os produtos da loja.
      </p>
      <Link href="/admin/categorias/nova">
        <Button>+ Criar Primeira Categoria</Button>
      </Link>
    </div>
  );
}

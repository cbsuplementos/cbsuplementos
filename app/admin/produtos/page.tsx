import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { PageHeader, Button } from "@/components/admin/FormFields";
import ProductActions from "@/components/admin/ProductActions";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * /admin/produtos
 *
 * Lista todos os produtos com filtros e ações rápidas.
 */
export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { name: true } },
    },
  });

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Produtos"
        description="Gerencie todos os produtos da loja."
        action={
          <Link href="/admin/produtos/novo">
            <Button>+ Novo Produto</Button>
          </Link>
        }
      />

      {products.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="bg-white border border-gold/10 overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-noir text-white">
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-widest font-medium">
                  Produto
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-widest font-medium">
                  Categoria
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-widest font-medium">
                  Preço
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-widest font-medium">
                  Estoque
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-widest font-medium">
                  Badge
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
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-graphite/50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-14 bg-noir/5 flex-shrink-0">
                        <Image
                          src={product.mainImage}
                          alt={product.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-display text-base text-noir truncate">
                          {product.name}
                          {product.featured && (
                            <span className="ml-2 text-xs text-gold-dark">★</span>
                          )}
                        </p>
                        <p className="text-xs text-cool-gray truncate">
                          /produtos/{product.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-noir">
                    {product.category.name}
                  </td>
                  <td className="px-4 py-4 text-sm text-noir font-medium">
                    {formatPrice(product.price.toString())}
                  </td>
                  <td className="px-4 py-4 text-sm text-noir">
                    {product.stock ?? "—"}
                  </td>
                  <td className="px-4 py-4">
                    {product.badge !== "NONE" ? (
                      <span className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-widest rounded ${
                        product.badge === "MAIS_VENDIDO" ? "bg-amber-100 text-amber-800" :
                        product.badge === "NOVIDADE" ? "bg-emerald-100 text-emerald-800" :
                        product.badge === "PROMOCAO" ? "bg-red-100 text-red-800" :
                        product.badge === "EXCLUSIVO" ? "bg-purple-100 text-purple-800" :
                        "bg-neutral-100 text-neutral-600"
                      }`}>
                        {product.badge === "MAIS_VENDIDO" ? "Mais Vendido" :
                         product.badge === "NOVIDADE" ? "Novidade" :
                         product.badge === "PROMOCAO" ? "Promoção" :
                         product.badge === "EXCLUSIVO" ? "Exclusivo" : "—"}
                      </span>
                    ) : (
                      <span className="text-xs text-cool-gray">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`
                        inline-block px-3 py-1 text-[10px] uppercase tracking-widest
                        ${
                          product.active
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }
                      `}
                    >
                      {product.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <ProductActions
                      id={product.id}
                      active={product.active}
                      featured={product.featured}
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
    <div className="bg-white border border-gold/10 p-12 text-center">
      <p className="font-display text-2xl text-noir mb-2">
        Nenhum produto cadastrado
      </p>
      <p className="text-cool-gray mb-6">
        Comece adicionando os produtos que aparecerão na vitrine.
      </p>
      <Link href="/admin/produtos/novo">
        <Button>+ Criar Primeiro Produto</Button>
      </Link>
    </div>
  );
}

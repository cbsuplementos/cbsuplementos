"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface CategoryFilterProps {
  categories: {
    slug: string;
    name: string;
    _count?: {
      products: number;
    };
  }[];
}

/**
 * CategoryFilter — Filtro de categoria via dropdown
 *
 * Estratégia técnica:
 * - Usa searchParams na URL (?categoria=vestidos) → permite compartilhar link filtrado
 * - Navega via router.push (não recarrega a página inteira)
 * - Server Component da listagem lê o searchParam e filtra no Prisma
 *
 * Por que dropdown e não chips?
 * - No mobile, dropdown é nativo do SO (picker do iOS/Android)
 * - Ocupa uma linha só, não precisa de scroll horizontal
 * - Acessibilidade nativa (a11y) sem esforço extra
 */
export default function CategoryFilter({ categories }: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("categoria") || "";

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (value) {
      router.push(`/produtos?categoria=${value}`);
    } else {
      router.push("/produtos");
    }
  }

  return (
    <div className="w-full sm:w-auto">
      <label htmlFor="category-filter" className="sr-only">
        Filtrar por categoria
      </label>
      <select
        id="category-filter"
        value={currentCategory}
        onChange={handleChange}
        className="w-full sm:w-64 px-4 py-3 bg-white border border-neutral-200 rounded-lg
                   text-neutral-900 text-sm font-medium
                   focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                   appearance-none cursor-pointer
                   bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M6%208L1%203h10z%22%2F%3E%3C%2Fsvg%3E')]
                   bg-[length:12px] bg-[right_16px_center] bg-no-repeat"
      >
        <option value="">Todas as categorias</option>
        {categories.map((cat) => (
          <option key={cat.slug} value={cat.slug}>
            {cat.name}
            {cat._count ? ` (${cat._count.products})` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toggleCategoryActive, deleteCategory } from "@/app/admin/categorias/actions";

interface CategoryActionsProps {
  id: string;
  active: boolean;
  hasProducts: boolean;
}

/**
 * Ações de cada linha da tabela de categorias
 *
 * Por que Client Component:
 * - Precisa de useTransition para loading states
 * - Confirm() de delete requer interação do usuário
 *
 * useTransition() é o hook moderno do React 19 para chamadas a
 * Server Actions — gerencia loading state automaticamente.
 */
export default function CategoryActions({ id, active, hasProducts }: CategoryActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleToggle() {
    setError(null);
    startTransition(async () => {
      const result = await toggleCategoryActive(id);
      if ("error" in result) setError(result.error);
    });
  }

  function handleDelete() {
    if (hasProducts) {
      alert("Não é possível deletar uma categoria com produtos vinculados.");
      return;
    }
    if (!confirm("Tem certeza que deseja deletar esta categoria? Esta ação não pode ser desfeita.")) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteCategory(id);
      if ("error" in result) setError(result.error);
    });
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        href={`/admin/categorias/${id}`}
        className="text-xs uppercase tracking-widest text-noir hover:text-gold-dark px-2 py-1"
      >
        Editar
      </Link>

      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className="text-xs uppercase tracking-widest text-noir hover:text-gold-dark px-2 py-1 disabled:opacity-50"
      >
        {active ? "Desativar" : "Ativar"}
      </button>

      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending || hasProducts}
        title={hasProducts ? "Não é possível deletar: tem produtos vinculados" : "Deletar"}
        className="text-xs uppercase tracking-widest text-red-600 hover:text-red-700 px-2 py-1 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Deletar
      </button>

      {error && (
        <span className="block text-xs text-red-600 mt-1">{error}</span>
      )}
    </div>
  );
}

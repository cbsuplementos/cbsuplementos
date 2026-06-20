"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  toggleProductActive,
  toggleProductFeatured,
  deleteProduct,
} from "@/app/admin/produtos/actions";

interface ProductActionsProps {
  id: string;
  active: boolean;
  featured: boolean;
}

export default function ProductActions({ id, active, featured }: ProductActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleToggleActive() {
    setError(null);
    startTransition(async () => {
      const result = await toggleProductActive(id);
      if ("error" in result) setError(result.error);
    });
  }

  function handleToggleFeatured() {
    setError(null);
    startTransition(async () => {
      const result = await toggleProductFeatured(id);
      if ("error" in result) setError(result.error);
    });
  }

  function handleDelete() {
    if (!confirm("Tem certeza que deseja deletar este produto? Esta ação não pode ser desfeita.")) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteProduct(id);
      if ("error" in result) setError(result.error);
    });
  }

  return (
    <div className="flex items-center justify-end gap-1 text-xs">
      <button
        type="button"
        onClick={handleToggleFeatured}
        disabled={isPending}
        title={featured ? "Remover destaque" : "Marcar como destaque"}
        className={`px-2 py-1 uppercase tracking-widest disabled:opacity-50 ${
          featured ? "text-gold-dark" : "text-noir/40 hover:text-gold-dark"
        }`}
      >
        ★
      </button>

      <Link
        href={`/admin/produtos/${id}`}
        className="px-2 py-1 uppercase tracking-widest text-noir hover:text-gold-dark"
      >
        Editar
      </Link>

      <button
        type="button"
        onClick={handleToggleActive}
        disabled={isPending}
        className="px-2 py-1 uppercase tracking-widest text-noir hover:text-gold-dark disabled:opacity-50"
      >
        {active ? "Desativar" : "Ativar"}
      </button>

      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="px-2 py-1 uppercase tracking-widest text-red-600 hover:text-red-700 disabled:opacity-50"
      >
        Deletar
      </button>

      {error && (
        <span className="block text-xs text-red-600 ml-2">{error}</span>
      )}
    </div>
  );
}

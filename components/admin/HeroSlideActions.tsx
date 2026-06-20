"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toggleHeroSlideActive, deleteHeroSlide } from "@/app/admin/hero/actions";

export default function HeroSlideActions({ id, active }: { id: string; active: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleToggle() {
    setError(null);
    startTransition(async () => {
      const result = await toggleHeroSlideActive(id);
      if ("error" in result) setError(result.error);
    });
  }

  function handleDelete() {
    if (!confirm("Deletar este slide? Esta ação não pode ser desfeita.")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteHeroSlide(id);
      if ("error" in result) setError(result.error);
    });
  }

  return (
    <div className="flex items-center gap-2 text-xs flex-shrink-0">
      <Link href={`/admin/hero/${id}`} className="uppercase tracking-widest text-noir hover:text-gold-dark px-2 py-1">
        Editar
      </Link>
      <button type="button" onClick={handleToggle} disabled={isPending} className="uppercase tracking-widest text-noir hover:text-gold-dark px-2 py-1 disabled:opacity-50">
        {active ? "Pausar" : "Ativar"}
      </button>
      <button type="button" onClick={handleDelete} disabled={isPending} className="uppercase tracking-widest text-red-600 hover:text-red-700 px-2 py-1 disabled:opacity-50">
        Deletar
      </button>
      {error && <span className="text-red-600">{error}</span>}
    </div>
  );
}

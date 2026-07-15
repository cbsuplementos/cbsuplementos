"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input, Button } from "@/components/admin/FormFields";
import {
  createBrand,
  renameBrand,
  toggleBrandActive,
  deleteBrand,
} from "./actions";

interface BrandItem {
  id: string;
  name: string;
  active: boolean;
  productCount: number;
}

interface BrandManagerProps {
  brands: BrandItem[];
  unbrandedCount: number;
}

/**
 * BrandManager — criar, renomear, ativar/desativar e excluir marcas.
 * Exclusão só é permitida para marca sem produtos (regra no servidor).
 */
export default function BrandManager({ brands, unbrandedCount }: BrandManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  function run(action: () => Promise<{ success?: true } | { error: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setNewName("");
      setEditingId(null);
      router.refresh();
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("name", newName);
    run(() => createBrand(fd));
  }

  function handleRename(id: string) {
    const fd = new FormData();
    fd.set("name", editingName);
    run(() => renameBrand(id, fd));
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir a marca "${name}"? Esta ação não pode ser desfeita.`)) return;
    run(() => deleteBrand(id));
  }

  return (
    <div className="space-y-6">
      {/* Criar */}
      <form
        onSubmit={handleCreate}
        className="flex flex-col sm:flex-row gap-3 bg-white border border-neutral-200 rounded-xl p-4"
      >
        <div className="flex-1">
          <Input
            label="Nova marca"
            name="name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ex: Max Titanium"
          />
        </div>
        <div className="sm:self-end">
          <Button type="submit" loading={isPending}>
            Criar
          </Button>
        </div>
      </form>

      {error && (
        <div role="alert" className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Produtos sem marca */}
      {unbrandedCount > 0 && (
        <Link
          href="/admin/produtos?marca=sem-marca"
          className="block px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 hover:bg-amber-100 transition-colors"
        >
          ⚠ <span className="font-semibold">{unbrandedCount}</span>{" "}
          {unbrandedCount === 1 ? "produto está" : "produtos estão"} sem marca —
          clique para ver e atribuir.
        </Link>
      )}

      {/* Lista */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        {brands.length === 0 ? (
          <p className="p-8 text-center text-sm text-neutral-500">
            Nenhuma marca cadastrada ainda. Crie a primeira acima — ou rode o
            script <code className="text-xs bg-neutral-100 px-1 py-0.5 rounded">populate-brands.ts</code>{" "}
            para importar as marcas da planilha da distribuidora.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {brands.map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-4 py-3">
                {editingId === b.id ? (
                  <>
                    <input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(b.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="flex-1 px-3 py-1.5 border border-neutral-300 rounded text-sm text-neutral-900 bg-white focus:outline-none focus:ring-1 focus:ring-gold"
                    />
                    <button
                      onClick={() => handleRename(b.id)}
                      disabled={isPending}
                      className="text-xs uppercase tracking-wider text-gold-dark hover:text-gold"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs uppercase tracking-wider text-neutral-400 hover:text-neutral-600"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-neutral-900">
                        {b.name}
                      </span>
                      {!b.active && (
                        <span className="ml-2 text-[10px] uppercase tracking-wider text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                          Inativa
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/admin/produtos?marca=${b.id}`}
                      className="text-xs text-neutral-500 hover:text-gold-dark whitespace-nowrap"
                      title="Ver produtos desta marca"
                    >
                      {b.productCount}{" "}
                      {b.productCount === 1 ? "produto" : "produtos"}
                    </Link>
                    <button
                      onClick={() => {
                        setEditingId(b.id);
                        setEditingName(b.name);
                        setError(null);
                      }}
                      className="text-xs uppercase tracking-wider text-neutral-500 hover:text-gold-dark"
                    >
                      Renomear
                    </button>
                    <button
                      onClick={() => run(() => toggleBrandActive(b.id))}
                      disabled={isPending}
                      className="text-xs uppercase tracking-wider text-neutral-500 hover:text-gold-dark"
                    >
                      {b.active ? "Desativar" : "Ativar"}
                    </button>
                    {b.productCount === 0 && (
                      <button
                        onClick={() => handleDelete(b.id, b.name)}
                        disabled={isPending}
                        className="text-xs uppercase tracking-wider text-red-400 hover:text-red-600"
                      >
                        Excluir
                      </button>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-neutral-400">
        Dica: no cadastro/edição de produto também dá para criar uma marca nova
        na hora, pelo campo &quot;ou criar nova marca&quot;.
      </p>
    </div>
  );
}

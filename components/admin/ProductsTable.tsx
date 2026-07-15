"use client";

import { useMemo, useRef, useState, useTransition, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ProductActions from "@/components/admin/ProductActions";
import {
  bulkUpdateProducts,
  bulkDeleteProducts,
} from "@/app/admin/produtos/actions";

/**
 * ProductsTable (E5 + QW7)
 *
 * Tabela client da lista de produtos do admin:
 *  - checkbox por linha + "selecionar página" + "selecionar todos os filtrados";
 *  - barra de ações em massa (ativar, desativar, badge, categoria, marca,
 *    excluir) que aparece quando há seleção;
 *  - cabeçalhos ordenáveis (links prontos vêm do servidor — a ordenação em
 *    si acontece lá, aqui só renderiza).
 *
 * Excluir segue a regra combinada: só roda quando todos os selecionados
 * estão inativos e sem pedidos — o servidor valida de novo.
 */

const badgeLabels: Record<string, string> = {
  MAIS_VENDIDO: "Mais Vendido",
  NOVIDADE: "Novidade",
  PROMOCAO: "Promoção",
  EXCLUSIVO: "Exclusivo",
};

export interface TableRow {
  id: string;
  name: string;
  slug: string;
  mainImage: string;
  categoryName: string;
  brandName: string | null;
  priceLabel: string;
  hasVariants: boolean;
  variantCount: number;
  stock: number | null;
  badge: string;
  active: boolean;
  featured: boolean;
}

export interface HeaderDef {
  key: string;
  label: string;
  href: string;
  sorted: "asc" | "desc" | null;
}

interface ProductsTableProps {
  rows: TableRow[];
  headers: HeaderDef[];
  allFilteredIds: string[];
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
}

type BulkAction =
  | ""
  | "ativar"
  | "desativar"
  | "badge"
  | "categoria"
  | "marca"
  | "excluir";

export default function ProductsTable({
  rows,
  headers,
  allFilteredIds,
  categories,
  brands,
}: ProductsTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [action, setAction] = useState<BulkAction>("");
  const [actionValue, setActionValue] = useState("");
  const [feedback, setFeedback] = useState<
    { kind: "ok" | "erro"; text: string } | null
  >(null);

  const pageIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const selectedOnPage = pageIds.filter((id) => selected.has(id));
  const allPageSelected =
    pageIds.length > 0 && selectedOnPage.length === pageIds.length;
  const somePageSelected = selectedOnPage.length > 0 && !allPageSelected;

  const headCheckbox = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (headCheckbox.current)
      headCheckbox.current.indeterminate = somePageSelected;
  }, [somePageSelected]);

  function togglePage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
    setAction("");
    setActionValue("");
  }

  function needsValue(a: BulkAction) {
    return a === "badge" || a === "categoria" || a === "marca";
  }

  function applyBulk() {
    setFeedback(null);
    const ids = [...selected];
    if (ids.length === 0) return;

    if (needsValue(action) && actionValue === "") {
      setFeedback({ kind: "erro", text: "Escolha o valor a aplicar." });
      return;
    }

    if (action === "excluir") {
      const ok1 = confirm(
        `Excluir ${ids.length} produto(s) PERMANENTEMENTE?\n\n` +
          "Regras: todos precisam estar inativos e sem pedidos. " +
          "Variações e imagens são removidas junto; o histórico de estoque é preservado."
      );
      if (!ok1) return;
      const ok2 = confirm(
        `Última confirmação: excluir ${ids.length} produto(s)? Esta ação não pode ser desfeita.`
      );
      if (!ok2) return;
    }

    startTransition(async () => {
      const result =
        action === "ativar"
          ? await bulkUpdateProducts(ids, { active: true })
          : action === "desativar"
            ? await bulkUpdateProducts(ids, { active: false })
            : action === "badge"
              ? await bulkUpdateProducts(ids, { badge: actionValue })
              : action === "categoria"
                ? await bulkUpdateProducts(ids, { categoryId: actionValue })
                : action === "marca"
                  ? await bulkUpdateProducts(ids, {
                      brandId: actionValue === "__sem__" ? null : actionValue,
                    })
                  : action === "excluir"
                    ? await bulkDeleteProducts(ids)
                    : { error: "Escolha uma ação." as const };

      if ("error" in result) {
        setFeedback({ kind: "erro", text: result.error });
        return;
      }
      setFeedback({
        kind: "ok",
        text:
          action === "excluir"
            ? `${result.count} produto(s) excluído(s).`
            : `${result.count} produto(s) atualizado(s).`,
      });
      clearSelection();
      router.refresh();
    });
  }

  return (
    <div>
      {/* ====== BARRA DE AÇÕES EM MASSA ====== */}
      {selected.size > 0 && (
        <div className="mx-4 mt-4 mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-amber-900">
              {selected.size} selecionado{selected.size === 1 ? "" : "s"}
            </span>

            {allPageSelected && allFilteredIds.length > selected.size && (
              <button
                onClick={() => setSelected(new Set(allFilteredIds))}
                className="text-xs font-medium text-amber-800 underline hover:text-amber-950"
              >
                Selecionar todos os {allFilteredIds.length} filtrados
              </button>
            )}

            <div className="flex flex-wrap items-center gap-2 ml-auto">
              <select
                value={action}
                onChange={(e) => {
                  setAction(e.target.value as BulkAction);
                  setActionValue("");
                  setFeedback(null);
                }}
                className="px-3 py-1.5 border border-amber-300 rounded-lg text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Ação em massa…</option>
                <option value="ativar">Ativar</option>
                <option value="desativar">Desativar</option>
                <option value="badge">Definir badge…</option>
                <option value="categoria">Trocar categoria…</option>
                <option value="marca">Trocar marca…</option>
                <option value="excluir">Excluir…</option>
              </select>

              {action === "badge" && (
                <select
                  value={actionValue}
                  onChange={(e) => setActionValue(e.target.value)}
                  className="px-3 py-1.5 border border-amber-300 rounded-lg text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Escolha o badge…</option>
                  <option value="NONE">Remover badge</option>
                  {Object.entries(badgeLabels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              )}

              {action === "categoria" && (
                <select
                  value={actionValue}
                  onChange={(e) => setActionValue(e.target.value)}
                  className="px-3 py-1.5 border border-amber-300 rounded-lg text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Escolha a categoria…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}

              {action === "marca" && (
                <select
                  value={actionValue}
                  onChange={(e) => setActionValue(e.target.value)}
                  className="px-3 py-1.5 border border-amber-300 rounded-lg text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Escolha a marca…</option>
                  <option value="__sem__">Sem marca</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={applyBulk}
                disabled={isPending || !action}
                className="px-4 py-1.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 disabled:opacity-40"
              >
                {isPending ? "Aplicando…" : "Aplicar"}
              </button>

              <button
                onClick={clearSelection}
                disabled={isPending}
                className="px-2 py-1.5 text-sm text-amber-800 hover:text-amber-950"
                title="Limpar seleção"
              >
                Limpar
              </button>
            </div>
          </div>

          {action === "excluir" && (
            <p className="mt-2 text-xs text-amber-800">
              Excluir só funciona quando <strong>todos</strong> os selecionados
              estão <strong>inativos</strong> e <strong>sem pedidos</strong> —
              caso contrário, use Desativar.
            </p>
          )}
        </div>
      )}

      {feedback && (
        <div
          role="status"
          className={`mx-4 mt-3 mb-3 px-4 py-3 rounded-lg text-sm border ${
            feedback.kind === "ok"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* ====== TABELA ====== */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[980px]">
          <thead className="bg-noir text-white">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  ref={headCheckbox}
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={togglePage}
                  aria-label="Selecionar todos da página"
                  className="h-4 w-4 accent-amber-500 cursor-pointer"
                />
              </th>
              {headers.map((h) => (
                <th
                  key={h.key}
                  className={`px-4 py-3 text-xs uppercase tracking-widest font-medium ${
                    h.key === "acoes" ? "text-right" : "text-left"
                  }`}
                >
                  {h.href ? (
                    <Link
                      href={h.href}
                      className="inline-flex items-center gap-1 hover:text-amber-300 transition-colors"
                    >
                      {h.label}
                      <span className="text-[10px] leading-none">
                        {h.sorted === "asc"
                          ? "▲"
                          : h.sorted === "desc"
                            ? "▼"
                            : "▵"}
                      </span>
                    </Link>
                  ) : (
                    h.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-noir/5">
            {rows.map((r) => (
              <tr
                key={r.id}
                className={`hover:bg-neutral-50 ${
                  selected.has(r.id) ? "bg-amber-50/60" : ""
                }`}
              >
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggleOne(r.id)}
                    aria-label={`Selecionar ${r.name}`}
                    className="h-4 w-4 accent-amber-500 cursor-pointer"
                  />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-14 bg-noir/5 flex-shrink-0">
                      <Image
                        src={r.mainImage}
                        alt={r.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-base text-noir truncate">
                        {r.name}
                        {r.featured && (
                          <span className="ml-2 text-xs text-gold-dark">★</span>
                        )}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">
                        /produtos/{r.slug}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-noir">{r.categoryName}</td>
                <td className="px-4 py-4 text-sm text-neutral-600">
                  {r.brandName ?? <span className="text-neutral-300">—</span>}
                </td>
                <td className="px-4 py-4 text-sm text-noir font-medium">
                  {r.hasVariants ? (
                    <span>
                      <span className="block text-[10px] uppercase tracking-wider text-neutral-400">
                        a partir de
                      </span>
                      {r.priceLabel}
                    </span>
                  ) : (
                    r.priceLabel
                  )}
                </td>
                <td className="px-4 py-4 text-sm text-noir">
                  {r.stock === null ? (
                    <span
                      className="text-neutral-400"
                      title="Sem controle de estoque — o site vende sem limite"
                    >
                      sem controle
                    </span>
                  ) : (
                    <span
                      className={
                        r.stock === 0
                          ? "text-red-600 font-medium"
                          : r.stock <= 5
                            ? "text-amber-600 font-medium"
                            : ""
                      }
                    >
                      {r.stock}
                    </span>
                  )}
                  {r.variantCount > 0 && (
                    <span className="ml-1 text-[10px] text-neutral-400">
                      em {r.variantCount} var.
                    </span>
                  )}
                </td>
                <td className="px-4 py-4">
                  {r.badge !== "NONE" ? (
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-widest rounded ${
                        r.badge === "MAIS_VENDIDO"
                          ? "bg-amber-100 text-amber-800"
                          : r.badge === "NOVIDADE"
                            ? "bg-emerald-100 text-emerald-800"
                            : r.badge === "PROMOCAO"
                              ? "bg-red-100 text-red-800"
                              : r.badge === "EXCLUSIVO"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {badgeLabels[r.badge] ?? "—"}
                    </span>
                  ) : (
                    <span className="text-xs text-neutral-500">—</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-block px-3 py-1 text-[10px] uppercase tracking-widest ${
                      r.active
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {r.active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <ProductActions
                    id={r.id}
                    active={r.active}
                    featured={r.featured}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

export interface VariantData {
  id?: string;
  name: string;
  price: string;
  costPrice: string;
  stock: number;
  minStock: number;
  sku: string;
  active: boolean;
}

interface VariantFormProps {
  variants: VariantData[];
  onChange: (variants: VariantData[]) => void;
  /**
   * true quando estamos EDITANDO um produto existente. Nesse modo o estoque
   * é somente leitura: mudanças de estoque acontecem por movimentação
   * registrada (app de Gestão), nunca por edição direta no formulário —
   * senão o ajuste não deixa rastro no histórico.
   */
  productEditing: boolean;
}

/**
 * VariantForm — Gerenciamento de variações de produto
 *
 * Usado dentro do ProductForm para adicionar/editar/remover
 * variações (ex.: sabores, tamanhos de pote, apresentações).
 *
 * Cada variação tem:
 * - Nome (obrigatório) — ex.: "Chocolate · Pote 900g"
 * - Preço de venda — cobrado no site e exibido no app de Gestão
 * - Custo — quanto você paga no fornecedor (base da margem)
 * - SKU — código único (opcional)
 * - Ativa — se aparece no site
 *
 * Estoque: definido no cadastro (estoque inicial, com registro de
 * inventário) e depois ajustado apenas via /gestao.
 */
export default function VariantForm({ variants, onChange, productEditing }: VariantFormProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  function addVariant() {
    const newVariant: VariantData = {
      name: "",
      price: "",
      costPrice: "",
      stock: 0,
      minStock: 5,
      sku: "",
      active: true,
    };
    const updated = [...variants, newVariant];
    onChange(updated);
    setExpandedIndex(updated.length - 1);
  }

  function updateVariant(index: number, field: keyof VariantData, value: string | number | boolean) {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  }

  function removeVariant(index: number) {
    const updated = variants.filter((_, i) => i !== index);
    onChange(updated);
    setExpandedIndex(null);
  }

  function toggleExpand(index: number) {
    setExpandedIndex(expandedIndex === index ? null : index);
  }

  const inputClass =
    "w-full px-3 py-2.5 bg-white border border-noir/15 rounded text-sm text-noir " +
    "focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold";
  const labelClass =
    "block text-xs font-medium uppercase tracking-wider text-noir/70 mb-1.5";

  return (
    <div className="space-y-4">
      {variants.length > 0 && (
        <div className="space-y-3">
          {variants.map((variant, index) => (
            <div
              key={variant.id || `new-${index}`}
              className="border border-noir/10 rounded-lg overflow-hidden"
            >
              {/* Header da variação (colapsável) */}
              <button
                type="button"
                onClick={() => toggleExpand(index)}
                className="w-full flex items-center justify-between px-4 py-3 bg-neutral-50 hover:bg-neutral-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-noir">
                    {variant.name || `Variação ${index + 1}`}
                  </span>
                  {variant.price && (
                    <span className="text-xs text-neutral-500">
                      R$ {variant.price}
                    </span>
                  )}
                  {variant.id && (
                    <span className="text-xs text-neutral-400">
                      · estoque {variant.stock}
                    </span>
                  )}
                  {!variant.active && (
                    <span className="text-[10px] uppercase tracking-wider text-red-500 bg-red-50 px-2 py-0.5 rounded">
                      Inativa
                    </span>
                  )}
                </div>
                <svg
                  className={`w-4 h-4 text-neutral-500 transition-transform ${
                    expandedIndex === index ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Campos expandidos */}
              {expandedIndex === index && (
                <div className="p-4 space-y-4 border-t border-noir/10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Nome da variação *</label>
                      <input
                        type="text"
                        required
                        value={variant.name}
                        onChange={(e) => updateVariant(index, "name", e.target.value)}
                        placeholder="Ex: Chocolate · Pote 900g"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>SKU (opcional)</label>
                      <input
                        type="text"
                        value={variant.sku}
                        onChange={(e) => updateVariant(index, "sku", e.target.value)}
                        placeholder="Ex: CB-WHEY-CHOC-900"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Preço de venda (R$) *</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        required
                        value={variant.price}
                        onChange={(e) => updateVariant(index, "price", e.target.value)}
                        placeholder="Ex: 299,90"
                        className={inputClass}
                      />
                      <p className="mt-1 text-[11px] text-neutral-400">
                        Cobrado no site e exibido no app de Gestão.
                      </p>
                    </div>

                    <div>
                      <label className={labelClass}>Custo (R$)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={variant.costPrice}
                        onChange={(e) => updateVariant(index, "costPrice", e.target.value)}
                        placeholder="Ex: 155,00"
                        className={inputClass}
                      />
                      <p className="mt-1 text-[11px] text-neutral-400">
                        Quanto você paga no fornecedor (opcional).
                      </p>
                    </div>
                  </div>

                  {/* Estoque: inicial no cadastro; somente leitura na edição */}
                  {productEditing && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Estoque mínimo</label>
                        <input
                          type="number"
                          min={0}
                          value={variant.minStock}
                          onChange={(e) => updateVariant(index, "minStock", parseInt(e.target.value) || 0)}
                          className={inputClass}
                        />
                        <p className="mt-1 text-[11px] text-neutral-400">
                          Alerta &quot;Repor&quot; quando o estoque ficar igual ou abaixo.
                        </p>
                      </div>
                    </div>
                  )}
                  {productEditing ? (
                    <div className="rounded bg-neutral-50 border border-noir/10 px-3 py-2.5">
                      {variant.id ? (
                        <p className="text-sm text-noir/70">
                          Estoque atual:{" "}
                          <span className="font-semibold text-noir">{variant.stock}</span>
                          <span className="text-neutral-400">
                            {" "}— ajuste pelo app de Gestão (/gestao), que registra a movimentação.
                          </span>
                        </p>
                      ) : (
                        <p className="text-sm text-noir/70">
                          Nova variação entra com estoque{" "}
                          <span className="font-semibold text-noir">0</span>
                          <span className="text-neutral-400">
                            {" "}— dê entrada pelo app de Gestão após salvar.
                          </span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Estoque inicial</label>
                        <input
                          type="number"
                          min={0}
                          value={variant.stock}
                          onChange={(e) => updateVariant(index, "stock", parseInt(e.target.value) || 0)}
                          className={inputClass}
                        />
                        <p className="mt-1 text-[11px] text-neutral-400">
                          Gera um registro de inventário inicial no histórico.
                        </p>
                      </div>
                      <div>
                        <label className={labelClass}>Estoque mínimo</label>
                        <input
                          type="number"
                          min={0}
                          value={variant.minStock}
                          onChange={(e) => updateVariant(index, "minStock", parseInt(e.target.value) || 0)}
                          className={inputClass}
                        />
                        <p className="mt-1 text-[11px] text-neutral-400">
                          Alerta &quot;Repor&quot; quando o estoque ficar igual ou abaixo.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={variant.active}
                        onChange={(e) => updateVariant(index, "active", e.target.checked)}
                        className="w-4 h-4 rounded border-noir/30 text-gold focus:ring-gold"
                      />
                      <span className="text-sm text-noir/70">Variação ativa</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="text-xs text-red-500 hover:text-red-700 uppercase tracking-wider transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addVariant}
        className="text-sm uppercase tracking-widest text-gold-dark hover:text-gold border-b border-gold-dark/50 pb-1"
      >
        + Adicionar variação
      </button>
    </div>
  );
}

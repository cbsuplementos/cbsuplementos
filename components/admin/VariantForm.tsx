"use client";

import { useState } from "react";
import { Input, Checkbox, Button } from "@/components/admin/FormFields";

export interface VariantData {
  id?: string;
  name: string;
  price: string;
  stock: number;
  sku: string;
  active: boolean;
}

interface VariantFormProps {
  variants: VariantData[];
  onChange: (variants: VariantData[]) => void;
}

/**
 * VariantForm — Gerenciamento de variações de produto
 *
 * Usado dentro do ProductForm para adicionar/editar/remover
 * variantes (ex: tamanho P/M/G, cores, etc).
 *
 * Cada variante tem:
 * - Nome (obrigatório) — ex: "Tamanho P", "Cor Azul"
 * - Preço — preço específico desta variante
 * - Estoque — quantidade desta variante
 * - SKU — código único (opcional)
 * - Ativo — se aparece no site
 */
export default function VariantForm({ variants, onChange }: VariantFormProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  function addVariant() {
    const newVariant: VariantData = {
      name: "",
      price: "",
      stock: 0,
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

  return (
    <div className="space-y-4">
      {variants.length > 0 && (
        <div className="space-y-3">
          {variants.map((variant, index) => (
            <div
              key={variant.id || `new-${index}`}
              className="border border-noir/10 rounded-lg overflow-hidden"
            >
              {/* Header da variante (colapsável) */}
              <button
                type="button"
                onClick={() => toggleExpand(index)}
                className="w-full flex items-center justify-between px-4 py-3 bg-neutral-50 hover:bg-neutral-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-noir">
                    {variant.name || `Variante ${index + 1}`}
                  </span>
                  {variant.price && (
                    <span className="text-xs text-neutral-500">
                      R$ {variant.price}
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
                      <label className="block text-xs font-medium uppercase tracking-wider text-noir/70 mb-1.5">
                        Nome da variante *
                      </label>
                      <input
                        type="text"
                        required
                        value={variant.name}
                        onChange={(e) => updateVariant(index, "name", e.target.value)}
                        placeholder="Ex: Tamanho P, Cor Azul"
                        className="w-full px-3 py-2.5 bg-white border border-noir/15 rounded text-sm text-noir
                                   focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-noir/70 mb-1.5">
                        SKU (opcional)
                      </label>
                      <input
                        type="text"
                        value={variant.sku}
                        onChange={(e) => updateVariant(index, "sku", e.target.value)}
                        placeholder="Ex: VQ-VEST-P-001"
                        className="w-full px-3 py-2.5 bg-white border border-noir/15 rounded text-sm text-noir
                                   focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-noir/70 mb-1.5">
                        Preço (R$) *
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        required
                        value={variant.price}
                        onChange={(e) => updateVariant(index, "price", e.target.value)}
                        placeholder="Ex: 189,90"
                        className="w-full px-3 py-2.5 bg-white border border-noir/15 rounded text-sm text-noir
                                   focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-noir/70 mb-1.5">
                        Estoque
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={variant.stock}
                        onChange={(e) => updateVariant(index, "stock", parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2.5 bg-white border border-noir/15 rounded text-sm text-noir
                                   focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={variant.active}
                        onChange={(e) => updateVariant(index, "active", e.target.checked)}
                        className="w-4 h-4 rounded border-noir/30 text-gold focus:ring-gold"
                      />
                      <span className="text-sm text-noir/70">Variante ativa</span>
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
        + Adicionar variante
      </button>
    </div>
  );
}

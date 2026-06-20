"use client";

import { useState } from "react";

interface Variant {
  id: string;
  name: string;
  price: string | number;
  stock: number;
  active: boolean;
  attributes: Record<string, string> | null;
}

interface VariantSelectorProps {
  variants: Variant[];
  basePrice: string | number;
  onVariantChange?: (variant: Variant | null) => void;
}

/**
 * VariantSelector — Botões visuais para selecionar variações
 *
 * Lógica de negócio:
 * - Se o produto TEM variants, o preço da variant selecionada prevalece
 * - Se NÃO tem variants, mostra só o preço base (este componente nem renderiza)
 * - Variantes inativas ou sem estoque ficam desabilitadas visualmente
 *
 * Agrupa por tipo de atributo (ex: "Tamanho" e "Cor" ficam em seções separadas)
 */
export default function VariantSelector({
  variants,
  basePrice,
  onVariantChange,
}: VariantSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Agrupa atributos por tipo para renderizar seções separadas
  const attributeGroups = new Map<string, { value: string; variantId: string; available: boolean }[]>();

  variants.forEach((v) => {
    if (v.attributes && typeof v.attributes === "object") {
      Object.entries(v.attributes).forEach(([key, value]) => {
        if (!attributeGroups.has(key)) {
          attributeGroups.set(key, []);
        }
        attributeGroups.get(key)!.push({
          value,
          variantId: v.id,
          available: v.active && v.stock > 0,
        });
      });
    }
  });

  // Se não tem atributos estruturados, mostra pelo nome da variant
  const hasStructuredAttributes = attributeGroups.size > 0;

  function handleSelect(variant: Variant) {
    if (!variant.active || variant.stock <= 0) return;

    const newId = selectedId === variant.id ? null : variant.id;
    setSelectedId(newId);
    onVariantChange?.(newId ? variant : null);
  }

  const selectedVariant = variants.find((v) => v.id === selectedId);
  const displayPrice = selectedVariant ? selectedVariant.price : basePrice;

  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(displayPrice));

  return (
    <div className="space-y-4">
      {/* Preço atualizado */}
      <p className="text-2xl sm:text-3xl font-bold text-neutral-900">
        {formattedPrice}
      </p>

      {hasStructuredAttributes ? (
        // Renderiza agrupado por tipo de atributo
        Array.from(attributeGroups.entries()).map(([attrName, values]) => (
          <div key={attrName}>
            <span className="text-sm font-medium text-neutral-600 uppercase tracking-wider">
              {attrName}
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {values.map((item) => {
                const variant = variants.find((v) => v.id === item.variantId)!;
                const isSelected = selectedId === item.variantId;
                const isAvailable = item.available;

                return (
                  <button
                    key={item.variantId + item.value}
                    onClick={() => handleSelect(variant)}
                    disabled={!isAvailable}
                    className={`
                      px-4 py-2 rounded-md text-sm font-medium border transition-all duration-200
                      ${isSelected
                        ? "bg-neutral-900 text-white border-neutral-900"
                        : isAvailable
                          ? "bg-white text-neutral-900 border-neutral-300 hover:border-amber-500 hover:text-amber-700"
                          : "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed line-through"
                      }
                    `}
                    title={!isAvailable ? "Indisponível" : `Selecionar ${item.value}`}
                  >
                    {item.value}
                  </button>
                );
              })}
            </div>
          </div>
        ))
      ) : (
        // Fallback: mostra pelo nome da variant
        <div>
          <span className="text-sm font-medium text-neutral-600 uppercase tracking-wider">
            Opções
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {variants.map((variant) => {
              const isSelected = selectedId === variant.id;
              const isAvailable = variant.active && variant.stock > 0;

              return (
                <button
                  key={variant.id}
                  onClick={() => handleSelect(variant)}
                  disabled={!isAvailable}
                  className={`
                    px-4 py-2 rounded-md text-sm font-medium border transition-all duration-200
                    ${isSelected
                      ? "bg-neutral-900 text-white border-neutral-900"
                      : isAvailable
                        ? "bg-white text-neutral-900 border-neutral-300 hover:border-amber-500 hover:text-amber-700"
                        : "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed line-through"
                    }
                  `}
                  title={!isAvailable ? "Indisponível" : `Selecionar ${variant.name}`}
                >
                  {variant.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Aviso de estoque baixo */}
      {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 3 && (
        <p className="text-sm text-amber-600 font-medium">
          ⚡ Apenas {selectedVariant.stock} em estoque
        </p>
      )}
    </div>
  );
}

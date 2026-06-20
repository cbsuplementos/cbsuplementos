"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";

interface AddToCartButtonProps {
  productId: string;
  variantId?: string;
  stock?: number | null;
  hasVariants?: boolean;
}

export default function AddToCartButton({
  productId,
  variantId,
  stock,
  hasVariants,
}: AddToCartButtonProps) {
  const { customer, addToCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Esgotado: stock = 0 e produto sem variantes (variantes têm próprio controle)
  const isOutOfStock = !hasVariants && stock === 0;

  async function handleClick() {
    if (!customer) {
      router.push("/conta/login");
      return;
    }
    if (isOutOfStock) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, variantId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao adicionar");
        setLoading(false);
        setTimeout(() => setError(""), 4000);
        return;
      }
      // Atualiza contagem do header
      await addToCart(productId, variantId);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {
      setError("Erro de conexão");
      setTimeout(() => setError(""), 4000);
    } finally {
      setLoading(false);
    }
  }

  if (isOutOfStock) {
    return (
      <div className="w-full">
        <button
          disabled
          className="flex items-center justify-center gap-3 w-full px-6 py-4
                     bg-neutral-200 text-neutral-500 font-semibold text-base sm:text-lg
                     rounded-xl cursor-not-allowed"
        >
          😔 Produto esgotado
        </button>
        <p className="mt-2 text-xs text-center text-neutral-500">
          Entre em contato pelo WhatsApp para saber quando voltará ao estoque.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`flex items-center justify-center gap-3 w-full px-6 py-4
                   font-semibold text-base sm:text-lg rounded-xl transition-all duration-300
                   shadow-lg hover:shadow-xl disabled:opacity-50
                   ${added
                     ? "bg-green-600 text-white"
                     : error
                       ? "bg-red-600 text-white"
                       : "bg-neutral-900 hover:bg-neutral-800 text-white"
                   }`}
      >
        {loading ? (
          "Adicionando..."
        ) : error ? (
          `⚠️ ${error}`
        ) : added ? (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Adicionado!
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            Adicionar ao carrinho
          </>
        )}
      </button>
      {!hasVariants && stock !== null && stock !== undefined && stock > 0 && stock <= 3 && (
        <p className="mt-2 text-xs text-center text-amber-600 font-medium">
          ⚡ Apenas {stock} em estoque
        </p>
      )}
    </div>
  );
}

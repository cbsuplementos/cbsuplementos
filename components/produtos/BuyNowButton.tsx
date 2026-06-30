"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";

interface BuyNowButtonProps {
  productId: string;
  variantId?: string;
  stock?: number | null;
  hasVariants?: boolean;
}

/**
 * BuyNowButton — Compra expressa
 *
 * Adiciona o produto ao carrinho (uma única chamada, via contexto) e
 * leva direto para o checkout. Diferencia-se visualmente do "Adicionar
 * ao carrinho" (dourado) e do WhatsApp (verde) com a cor âmbar.
 *
 * Esgotado → não renderiza (o AddToCartButton já comunica a indisponibilidade).
 */
export default function BuyNowButton({
  productId,
  variantId,
  stock,
  hasVariants,
}: BuyNowButtonProps) {
  const { customer, addToCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const isOutOfStock = !hasVariants && stock === 0;
  if (isOutOfStock) return null;

  async function handleClick() {
    if (!customer) {
      router.push("/conta/login");
      return;
    }

    setLoading(true);
    setError("");

    const result = await addToCart(productId, variantId);
    if (!result.ok) {
      setError(result.error || "Erro ao processar");
      setLoading(false);
      setTimeout(() => setError(""), 4000);
      return;
    }

    // Vai direto pro checkout — não reseta o loading, a navegação assume daqui.
    router.push("/checkout");
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center justify-center gap-3 w-full px-6 py-4
                 font-semibold text-base sm:text-lg rounded-xl transition-all duration-300
                 shadow-lg hover:shadow-xl disabled:opacity-50
                 ${error
                   ? "bg-red-600 text-white"
                   : "bg-amber-500 hover:bg-amber-600 text-noir"
                 }`}
    >
      {loading ? (
        "Processando..."
      ) : error ? (
        `⚠️ ${error}`
      ) : (
        <>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
          </svg>
          Comprar agora
        </>
      )}
    </button>
  );
}

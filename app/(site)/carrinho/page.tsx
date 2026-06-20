"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";

interface CartItemData {
  id: string;
  quantity: number;
  product: { id: string; name: string; slug: string; price: string; mainImage: string; weight: number; width: number; height: number; length: number };
  variant: { id: string; name: string; price: string } | null;
}

export default function CarrinhoPage() {
  const { customer, refreshCart } = useCart();
  const router = useRouter();
  const [items, setItems] = useState<CartItemData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customer) { router.push("/conta/login"); return; }
    fetchCart();
  }, [customer, router]);

  async function fetchCart() {
    const res = await fetch("/api/cart");
    const data = await res.json();
    setItems(data.cart?.items || []);
    setLoading(false);
  }

  async function updateQty(itemId: string, quantity: number) {
    await fetch("/api/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, quantity }),
    });
    fetchCart();
    refreshCart();
  }

  async function removeItem(itemId: string) {
    await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });
    fetchCart();
    refreshCart();
  }

  const subtotal = items.reduce((sum, item) => {
    const price = item.variant ? Number(item.variant.price) : Number(item.product.price);
    return sum + price * item.quantity;
  }, 0);

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-neutral-400">Carregando...</p></div>;

  return (
    <section className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-neutral-900 mb-8">Meu Carrinho</h1>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-neutral-400 text-lg mb-4">Seu carrinho está vazio.</p>
            <Link href="/produtos" className="inline-block px-6 py-3 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors">
              Ver produtos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const price = item.variant ? Number(item.variant.price) : Number(item.product.price);
                return (
                  <div key={item.id} className="flex gap-4 bg-white p-4 rounded-xl border border-neutral-200">
                    <div className="relative w-20 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-neutral-100">
                      <Image src={item.product.mainImage} alt={item.product.name} fill sizes="80px" className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/produtos/${item.product.slug}`} className="text-sm font-medium text-neutral-900 hover:text-amber-600 line-clamp-2">
                        {item.product.name}
                      </Link>
                      {item.variant && <p className="text-xs text-neutral-500 mt-0.5">{item.variant.name}</p>}
                      <p className="text-sm font-semibold text-neutral-900 mt-1">{fmt(price)}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center border border-neutral-200 rounded-lg">
                          <button onClick={() => item.quantity > 1 && updateQty(item.id, item.quantity - 1)}
                            className="px-2.5 py-1 text-neutral-500 hover:text-neutral-900">−</button>
                          <span className="px-2 text-sm font-medium">{item.quantity}</span>
                          <button onClick={() => updateQty(item.id, item.quantity + 1)}
                            className="px-2.5 py-1 text-neutral-500 hover:text-neutral-900">+</button>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-xs text-red-500 hover:text-red-700">Remover</button>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-neutral-900 whitespace-nowrap">{fmt(price * item.quantity)}</p>
                  </div>
                );
              })}
            </div>

            <div className="bg-white p-6 rounded-xl border border-neutral-200 h-fit sticky top-24">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Resumo</h2>
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-neutral-600">Subtotal ({items.length} {items.length === 1 ? "item" : "itens"})</span>
                <span className="font-medium">{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between mb-4 text-sm">
                <span className="text-neutral-600">Frete</span>
                <span className="text-neutral-400">Calculado no checkout</span>
              </div>
              <hr className="mb-4" />
              <div className="flex justify-between mb-6">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-bold">{fmt(subtotal)}</span>
              </div>
              <Link href="/checkout"
                className="block w-full text-center py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors">
                Finalizar compra
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

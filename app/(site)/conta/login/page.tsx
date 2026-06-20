"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import Logo from "@/components/Logo";

export default function CustomerLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refreshSession } = useCart();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/customer/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      setLoading(false);
      return;
    }

    await refreshSession();
    router.push("/produtos");
  }

  return (
    <section className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" aria-label="CB Suplementos">
            <Logo variant="compact" className="h-12 w-auto" />
          </Link>
          <h1 className="text-3xl font-bold font-display text-neutral-900 mt-6">Entrar na conta</h1>
          <p className="mt-2 text-neutral-500 text-center">Acesse para adicionar produtos ao carrinho e comprar.</p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-neutral-200">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-800 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">Senha</label>
              <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-neutral-900 text-white font-semibold rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50">
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-500">
            Não tem conta?{" "}
            <Link href="/conta/cadastro" className="text-amber-600 hover:text-amber-700 font-medium">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

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
    <section className="min-h-screen bg-noir flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" aria-label="CB Suplementos">
            <Logo variant="compact" className="h-12 w-auto" />
          </Link>
          <h1 className="text-3xl font-bold font-display text-white mt-6">Entrar na conta</h1>
          <p className="mt-2 text-cool-gray text-center">Acesse para adicionar produtos ao carrinho e comprar.</p>
        </div>

        <div className="bg-charcoal p-6 sm:p-8 border border-gold/15">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 text-red-300 text-sm border border-red-500/30">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1">Email</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-noir border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-gold transition-colors" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-1">Senha</label>
              <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-noir border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-gold transition-colors" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gold text-noir font-bold uppercase tracking-wider hover:bg-gold-light transition-colors disabled:opacity-50">
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-cool-gray">
            Não tem conta?{" "}
            <Link href="/conta/cadastro" className="text-gold hover:text-gold-light font-medium">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

/**
 * LoginForm — Client Component
 *
 * Por que Client Component:
 * - Precisa de useState (campos do formulário, loading, erros)
 * - Precisa do signIn() do next-auth/react (versão client)
 * - useRouter() para redirect após login
 *
 * Fluxo:
 * 1. Usuário digita email/senha e submete
 * 2. signIn() chama internamente o /api/auth/signin
 * 3. NextAuth executa o authorize() em lib/auth.ts
 * 4. Se OK → redireciona para callbackUrl (ou /admin/dashboard)
 * 5. Se falha → mostra mensagem de erro
 *
 * Importante: redirect: false força tratar o resultado manualmente,
 * permitindo mostrar erros sem recarregar a página.
 */
export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // NextAuth retorna "CredentialsSignin" para credenciais inválidas
        setError("Email ou senha incorretos. Tente novamente.");
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        // Login bem-sucedido — redireciona
        router.push(callbackUrl);
        router.refresh(); // força revalidação do server state
      }
    } catch {
      setError("Erro ao processar login. Tente novamente em instantes.");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ============ EMAIL ============ */}
      <div>
        <label
          htmlFor="email"
          className="block text-xs uppercase tracking-widest text-gold-light/80 mb-2"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          disabled={isLoading}
          className="
            w-full px-4 py-3
            bg-transparent border border-gold/30
            text-white placeholder-white/30
            focus:outline-none focus:border-gold
            transition-colors duration-300
            disabled:opacity-50
          "
          placeholder="seu@email.com"
        />
      </div>

      {/* ============ SENHA ============ */}
      <div>
        <label
          htmlFor="password"
          className="block text-xs uppercase tracking-widest text-gold-light/80 mb-2"
        >
          Senha
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          disabled={isLoading}
          className="
            w-full px-4 py-3
            bg-transparent border border-gold/30
            text-white placeholder-white/30
            focus:outline-none focus:border-gold
            transition-colors duration-300
            disabled:opacity-50
          "
          placeholder="••••••••"
        />
      </div>

      {/* ============ MENSAGEM DE ERRO ============ */}
      {error && (
        <div
          role="alert"
          className="px-4 py-3 bg-red-950/30 border border-red-500/30 text-red-200 text-sm"
        >
          {error}
        </div>
      )}

      {/* ============ BOTÃO SUBMIT ============ */}
      <button
        type="submit"
        disabled={isLoading}
        className="
          w-full py-3
          bg-gold text-noir
          text-sm uppercase tracking-widest font-medium
          hover:bg-gold-light
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-300
        "
      >
        {isLoading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}

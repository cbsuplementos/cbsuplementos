import { Suspense } from "react";
import LoginForm from "./LoginForm";
import Logo from "@/components/Logo";

/**
 * Página de Login — /login
 *
 * Server Component que renderiza o LoginForm (Client Component).
 */
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-noir px-4">
      <div className="w-full max-w-md">
        {/* ============ LOGO ============ */}
        <div className="flex flex-col items-center mb-10">
          <Logo
            variant="horizontal"
            priority
            className="h-20 sm:h-24 w-auto mb-2"
          />
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold-light/70 mt-3">
            Painel Administrativo
          </p>
        </div>

        {/* ============ FORMULÁRIO ============ */}
        <div className="bg-noir border border-gold/20 p-8 sm:p-10">
          <Suspense fallback={<LoginFormFallback />}>
            <LoginForm />
          </Suspense>
        </div>

        {/* ============ LINK PARA O SITE ============ */}
        <div className="text-center mt-8">
          <a
            href="/"
            className="text-xs uppercase tracking-widest text-white/40 hover:text-gold transition-colors duration-300"
          >
            ← Voltar para o site
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * Fallback simples enquanto o LoginForm carrega
 */
function LoginFormFallback() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 bg-white/5 rounded" />
      <div className="h-10 bg-white/5 rounded" />
      <div className="h-12 bg-gold/30 rounded" />
    </div>
  );
}

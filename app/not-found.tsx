import Link from "next/link";
import Logo from "@/components/Logo";

/**
 * 404 — Página não encontrada
 *
 * Mantém a identidade visual da CB Suplementos (preto/dourado).
 * Logo icon (CB) como marca presente, sem competir com o número 404.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-noir flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <Logo
          variant="icon"
          className="h-16 w-auto mx-auto mb-6 opacity-90"
        />

        <p className="text-7xl sm:text-9xl font-display text-gold mb-4 text-glow">404</p>

        <h1 className="text-xl sm:text-2xl font-display text-white mb-3 tracking-wide">
          Página não encontrada
        </h1>

        <p className="text-sm sm:text-base text-white/60 mb-8 leading-relaxed">
          A página que você procura não existe ou foi movida. Que tal dar uma
          olhada nos nossos produtos?
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/produtos" className="btn-primary">
            Ver Produtos
          </Link>
          <Link href="/" className="btn-outline">
            Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

/**
 * Error — Boundary global de erros
 *
 * Captura erros inesperados em runtime e exibe uma tela
 * amigável com botão de retry. Precisa ser Client Component
 * porque o Next.js exige para error boundaries.
 */
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-noir flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-5xl sm:text-6xl mb-4">⚠️</p>

        <h1 className="text-xl sm:text-2xl font-display text-white mb-3">
          Algo deu errado
        </h1>

        <p className="text-sm sm:text-base text-white/60 mb-8 leading-relaxed">
          Ocorreu um erro inesperado. Tente novamente ou
          volte para a página inicial.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-gold text-noir text-xs uppercase tracking-widest font-medium
                       hover:bg-gold-light transition-colors duration-300"
          >
            Tentar Novamente
          </button>
          <a
            href="/"
            className="px-6 py-3 border border-gold/40 text-gold text-xs uppercase tracking-widest
                       hover:bg-gold hover:text-noir transition-colors duration-300"
          >
            Voltar ao Início
          </a>
        </div>
      </div>
    </div>
  );
}

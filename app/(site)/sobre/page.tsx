import { Metadata } from "next";
import Logo from "@/components/Logo";

export const metadata: Metadata = {
  title: "Sobre Nós | CB Suplementos",
  description:
    "Conheça a CB Suplementos. Loja virtual de suplementos esportivos com produtos 100% originais e entrega para todo Brasil.",
  openGraph: {
    title: "Sobre Nós | CB Suplementos",
    description: "Conheça a história da CB Suplementos.",
  },
};

/**
 * /sobre — Página institucional "Quem Somos"
 *
 * Objetivo de negócio:
 * - Transparecer confiança (produtos originais, parceria com distribuidores)
 * - Humanizar a marca (paixão por treino e resultado)
 * - SEO (mencionar suplementos, marcas, nichos de mercado)
 */
export default function SobrePage() {
  return (
    <section className="min-h-screen bg-noir">
      {/* Hero do Sobre */}
      <div className="bg-noir border-b border-gold/20 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gold mb-4">
            Nossa Missão
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold font-display text-white tracking-tight">
            Combustível para
            <br />
            <span className="text-gold text-glow">Quem Treina de Verdade</span>
          </h1>
          <p className="mt-6 text-cool-gray text-base sm:text-lg max-w-2xl mx-auto">
            Suplementos sérios, marcas certificadas e atendimento direto com
            quem entende do assunto.
          </p>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Bloco 1 — Quem somos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="relative aspect-square overflow-hidden bg-charcoal border border-gold/10 flex items-center justify-center p-6">
            <Logo
              variant="full"
              className="w-full h-auto max-w-sm"
              alt="Logo CB Suplementos"
            />
          </div>

          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-display tracking-tight">
              <span className="text-gold">CB</span> Suplementos
            </h2>
            <div className="mt-4 space-y-4 text-cool-gray leading-relaxed">
              <p>
                A CB Suplementos nasceu da paixão por treino e do incômodo com
                a quantidade de produto duvidoso vendido por aí. Nosso compromisso
                é simples: vender apenas o que a gente compraria pra usar.
              </p>
              <p>
                Trabalhamos com as marcas mais respeitadas do mercado nacional —
                Growth, Max Titanium, Black Skull, Integralmédica, Probiótica,
                Dux Nutrition — sempre com nota fiscal e procedência rastreável.
              </p>
            </div>
          </div>
        </div>

        {/* Separador decorativo */}
        <div className="my-12 sm:my-16 flex items-center justify-center">
          <div className="h-px w-16 bg-gold" />
          <span className="mx-4 text-gold text-2xl">⚡</span>
          <div className="h-px w-16 bg-gold" />
        </div>

        {/* Bloco 2 — Valores */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div className="p-6 bg-charcoal border border-gold/10">
            <div className="w-14 h-14 mx-auto bg-gold/10 text-gold rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white font-display tracking-wide">
              Originalidade
            </h3>
            <p className="mt-2 text-sm text-cool-gray">
              100% dos produtos com origem rastreável e nota fiscal.
            </p>
          </div>

          <div className="p-6 bg-charcoal border border-gold/10">
            <div className="w-14 h-14 mx-auto bg-gold/10 text-gold rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white font-display tracking-wide">
              Entrega Rápida
            </h3>
            <p className="mt-2 text-sm text-cool-gray">
              Despacho em até 24h úteis após confirmação do pagamento.
            </p>
          </div>

          <div className="p-6 bg-charcoal border border-gold/10">
            <div className="w-14 h-14 mx-auto bg-gold/10 text-gold rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white font-display tracking-wide">
              Suporte Real
            </h3>
            <p className="mt-2 text-sm text-cool-gray">
              Atendimento direto no WhatsApp com quem treina e entende.
            </p>
          </div>
        </div>

        {/* Separador */}
        <div className="my-12 sm:my-16 flex items-center justify-center">
          <div className="h-px w-16 bg-gold" />
          <span className="mx-4 text-gold text-2xl">⚡</span>
          <div className="h-px w-16 bg-gold" />
        </div>

        {/* CTA final */}
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white font-display tracking-tight">
            Pronto para subir o nível?
          </h2>
          <p className="mt-3 text-cool-gray max-w-lg mx-auto">
            Explore o catálogo completo e encontre o suplemento certo para o seu
            objetivo.
          </p>
          <a href="/produtos" className="btn-primary mt-8">
            Ver Produtos →
          </a>
        </div>
      </div>
    </section>
  );
}

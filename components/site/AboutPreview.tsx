import Link from "next/link";
import Logo from "@/components/Logo";

/**
 * AboutPreview — Sobre a CB Suplementos (preview)
 *
 * Substitui a imagem genérica por uma versão grande da logo da marca,
 * reforçando a identidade visual em vez de usar foto stock genérica.
 *
 * Mobile: empilhado (logo topo, texto baixo)
 * Desktop: lado a lado
 */
export default function AboutPreview() {
  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-noir text-white overflow-hidden border-t border-gold/10">
      <div className="container-padded">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-20 items-center">
          {/* Logo full grande (marca como protagonista) */}
          <div className="relative order-1 flex items-center justify-center p-6 sm:p-8 lg:p-10 bg-graphite border border-gold/15">
            <Logo
              variant="full"
              className="w-full max-w-md h-auto"
              alt="Logo CB Suplementos"
            />
            <div
              className="absolute -inset-3 border border-gold/30 -z-10 hidden lg:block"
              aria-hidden="true"
            />
          </div>

          {/* Texto */}
          <div className="order-2">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-gold mb-4 sm:mb-6">
              Sobre Nós
            </p>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl mb-5 sm:mb-8 leading-tight tracking-tight">
              Combustível para
              <br />
              <span className="text-gold">resultados reais</span>.
            </h2>
            <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-white/70 leading-relaxed">
              <p>
                A CB Suplementos nasceu para entregar o que o atleta de verdade
                precisa: produtos 100% originais, marcas que entregam resultado
                e preço justo.
              </p>
              <p>
                Selecionamos cada item do nosso catálogo pensando em quem treina
                pesado, leva a alimentação a sério e não tem tempo a perder com
                produto duvidoso.
              </p>
            </div>
            <Link
              href="/sobre"
              className="inline-block mt-8 sm:mt-10 text-xs uppercase tracking-widest text-gold border-b border-gold pb-1 hover:text-gold-light hover:border-gold-light transition-colors duration-300"
            >
              Saiba Mais Sobre Nós →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

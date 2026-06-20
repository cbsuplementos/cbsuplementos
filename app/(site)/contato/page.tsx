import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contato | CB Suplementos",
  description:
    "Entre em contato com a CB Suplementos. Atendimento via WhatsApp e e-mail. Loja virtual de suplementos com entrega para todo Brasil.",
  openGraph: {
    title: "Contato | CB Suplementos",
    description: "Fale conosco pelo WhatsApp ou e-mail.",
  },
};

/**
 * /contato — Página de contato (loja 100% online)
 *
 * Como não há loja física, foca em WhatsApp, e-mail e redes sociais.
 */
export default function ContatoPage() {
  const phoneNumber = "559199266197";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    "Olá! Gostaria de saber mais sobre os produtos da CB Suplementos."
  )}`;

  return (
    <section className="min-h-screen bg-noir">
      {/* Hero */}
      <div className="bg-noir border-b border-gold/20 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gold mb-4">
            Fale conosco
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display text-white tracking-tight">
            Estamos aqui pra te ajudar
          </h1>
          <p className="mt-4 text-cool-gray text-base sm:text-lg max-w-2xl mx-auto">
            Dúvidas sobre suplementação, pedidos ou frete? Chama a gente!
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-charcoal border border-gold/10 hover:border-gold p-8 transition-all duration-300"
          >
            <div className="w-14 h-14 bg-gold/10 text-gold flex items-center justify-center mb-5 group-hover:bg-gold group-hover:text-noir transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
              </svg>
            </div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-gold mb-2">
              Atendimento Rápido
            </p>
            <h2 className="font-display text-2xl text-white mb-1 tracking-wide">
              WhatsApp
            </h2>
            <p className="text-white text-lg font-medium mb-3">
              (91) 9926-6197
            </p>
            <p className="text-sm text-cool-gray leading-relaxed">
              Tire dúvidas sobre produtos, frete, pedidos e suplementação.
            </p>
          </a>

          {/* E-mail */}
          <a
            href="mailto:contato@cbsuplementos.com.br"
            className="group bg-charcoal border border-gold/10 hover:border-gold p-8 transition-all duration-300"
          >
            <div className="w-14 h-14 bg-gold/10 text-gold flex items-center justify-center mb-5 group-hover:bg-gold group-hover:text-noir transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-gold mb-2">
              Suporte e Parcerias
            </p>
            <h2 className="font-display text-2xl text-white mb-1 tracking-wide">
              E-mail
            </h2>
            <p className="text-white text-base font-medium mb-3 break-all">
              contato@cbsuplementos.com.br
            </p>
            <p className="text-sm text-cool-gray leading-relaxed">
              Resposta em até 24h úteis.
            </p>
          </a>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/cb_suplementos_oficial"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-charcoal border border-gold/10 hover:border-gold p-8 transition-all duration-300"
          >
            <div className="w-14 h-14 bg-gold/10 text-gold flex items-center justify-center mb-5 group-hover:bg-gold group-hover:text-noir transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-gold mb-2">
              Conteúdo e Novidades
            </p>
            <h2 className="font-display text-2xl text-white mb-1 tracking-wide">
              Instagram
            </h2>
            <p className="text-white text-base font-medium mb-3">
              @cb_suplementos_oficial
            </p>
            <p className="text-sm text-cool-gray leading-relaxed">
              Dicas, lançamentos e promoções no nosso perfil.
            </p>
          </a>

          {/* Horário */}
          <div className="bg-charcoal border border-gold/10 p-8">
            <div className="w-14 h-14 bg-gold/10 text-gold flex items-center justify-center mb-5">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-gold mb-2">
              Atendimento
            </p>
            <h2 className="font-display text-2xl text-white mb-3 tracking-wide">
              Horários
            </h2>
            <div className="space-y-1 text-white">
              <p className="flex justify-between">
                <span className="text-cool-gray">Segunda a Sexta</span>
                <span className="font-medium">08h — 20h</span>
              </p>
              <p className="flex justify-between">
                <span className="text-cool-gray">Sábado</span>
                <span className="font-medium">09h — 16h</span>
              </p>
              <p className="flex justify-between">
                <span className="text-cool-gray">Domingo</span>
                <span className="font-medium text-cool-gray">Fechado</span>
              </p>
            </div>
          </div>
        </div>

        {/* Aviso loja online */}
        <div className="mt-10 p-6 bg-gold/5 border border-gold/20 text-center">
          <p className="text-sm text-white">
            <span className="font-bold text-gold">100% online:</span>{" "}
            Atendemos via WhatsApp e e-mail. Entregamos para todo o Brasil.
          </p>
        </div>
      </div>
    </section>
  );
}

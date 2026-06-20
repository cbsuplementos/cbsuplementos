/**
 * BenefitsSection — Diferenciais da CB Suplementos
 *
 * Substitui a antiga "LocationSection" (mapa da loja física), já que
 * a CB Suplementos é 100% online. Mostra os 4 principais argumentos
 * de venda para gerar confiança no cliente que chega no site.
 *
 * Mobile-first: 1 coluna no mobile, 2 no tablet, 4 no desktop.
 */
const benefits = [
  {
    title: "100% Originais",
    desc: "Trabalhamos apenas com distribuidores oficiais. Nota fiscal em todos os pedidos.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Entrega para Todo Brasil",
    desc: "Despachamos via Correios, Jadlog e Loggi. Frete grátis em compras acima de R$ 299.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
  },
  {
    title: "Pagamento Seguro",
    desc: "Pix, cartão em até 12x e boleto. Ambiente protegido com criptografia.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: "Suporte Especializado",
    desc: "Tire dúvidas sobre suplementação direto no WhatsApp com nossa equipe.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
  },
];

export default function BenefitsSection() {
  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-graphite border-t border-gold/10">
      <div className="container-padded">
        {/* Cabeçalho */}
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-gold mb-3">
            Por que CB Suplementos
          </p>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white">
            Diferenciais que <span className="text-gold">fazem a diferença</span>
          </h2>
        </div>

        {/* Grid de benefícios */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="bg-charcoal border border-gold/10 p-6 sm:p-8 hover:border-gold/40 transition-colors duration-300"
            >
              <div className="w-12 h-12 bg-gold/10 text-gold flex items-center justify-center mb-5">
                {b.icon}
              </div>
              <h3 className="font-display text-xl sm:text-2xl text-white mb-2 tracking-wide">
                {b.title}
              </h3>
              <p className="text-sm text-cool-gray leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

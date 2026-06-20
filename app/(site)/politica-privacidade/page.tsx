import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade | CB Suplementos",
  description: "Saiba como a CB Suplementos coleta, usa e protege seus dados pessoais.",
};

/**
 * /politica-privacidade — Exigida pela LGPD
 *
 * Conteúdo conforme operação atual: loja virtual com e-commerce completo.
 */
export default function PoliticaPrivacidadePage() {
  return (
    <section className="min-h-screen bg-noir text-white">
      {/* Hero */}
      <div className="bg-noir border-b border-gold/20 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold font-display text-white tracking-tight">
            Política de Privacidade
          </h1>
          <p className="mt-3 text-cool-gray text-sm">
            Última atualização: Junho de 2026
          </p>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="space-y-8 text-cool-gray">

          <div>
            <h2 className="text-xl font-bold text-white font-display tracking-wide mb-3">
              1. Quem somos
            </h2>
            <p className="leading-relaxed">
              A CB Suplementos é uma loja virtual de suplementos esportivos que
              opera 100% online, com entrega para todo o território brasileiro.
              Esta política descreve como coletamos, usamos e protegemos suas
              informações pessoais.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white font-display tracking-wide mb-3">
              2. Dados que coletamos
            </h2>
            <p className="leading-relaxed">
              Quando você navega no nosso site, cria uma conta ou faz um pedido,
              podemos coletar: nome completo, CPF, telefone, e-mail, data de
              nascimento, endereço de entrega, dados de pagamento (processados
              de forma segura pelo Mercado Pago — não armazenamos números de
              cartão) e dados de navegação anônimos (páginas visitadas,
              dispositivo, IP).
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white font-display tracking-wide mb-3">
              3. Como usamos seus dados
            </h2>
            <p className="leading-relaxed">
              Seus dados são utilizados para: processar pedidos e pagamentos,
              calcular frete via Correios/Melhor Envio, emitir nota fiscal,
              enviar atualizações sobre o status do pedido, oferecer suporte
              via WhatsApp/e-mail, e cumprir obrigações fiscais e legais.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white font-display tracking-wide mb-3">
              4. Compartilhamento de dados
            </h2>
            <p className="leading-relaxed">
              Compartilhamos dados estritamente necessários com: Mercado Pago
              (processamento de pagamento), Melhor Envio e Correios (cálculo e
              postagem de frete), Cloudinary (armazenamento de imagens),
              Railway (hospedagem). Não vendemos nem cedemos seus dados a
              terceiros para fins de marketing.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white font-display tracking-wide mb-3">
              5. Seus direitos (LGPD)
            </h2>
            <p className="leading-relaxed">
              Você pode, a qualquer momento, solicitar: confirmação da
              existência de tratamento dos seus dados, acesso aos dados,
              correção de dados incompletos ou desatualizados, eliminação dos
              dados pessoais, portabilidade. Basta entrar em contato pelo
              WhatsApp ou pelo e-mail{" "}
              <a
                href="mailto:contato@cbsuplementos.com.br"
                className="text-gold hover:text-gold-light"
              >
                contato@cbsuplementos.com.br
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white font-display tracking-wide mb-3">
              6. Segurança
            </h2>
            <p className="leading-relaxed">
              Utilizamos HTTPS em todo o site, senhas armazenadas com hash
              bcrypt, autenticação via JWT em cookie HttpOnly e processamento
              de pagamento via PCI-compliant Mercado Pago.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white font-display tracking-wide mb-3">
              7. Cookies
            </h2>
            <p className="leading-relaxed">
              Usamos cookies essenciais para manter sua sessão logada e seu
              carrinho de compras. Não utilizamos cookies de terceiros para
              rastreamento publicitário.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white font-display tracking-wide mb-3">
              8. Contato
            </h2>
            <p className="leading-relaxed">
              Dúvidas sobre esta política? Fale com a gente pelo WhatsApp{" "}
              <a href="https://wa.me/559199266197" className="text-gold hover:text-gold-light">
                (91) 9926-6197
              </a>{" "}
              ou pelo e-mail{" "}
              <a
                href="mailto:contato@cbsuplementos.com.br"
                className="text-gold hover:text-gold-light"
              >
                contato@cbsuplementos.com.br
              </a>
              .
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}

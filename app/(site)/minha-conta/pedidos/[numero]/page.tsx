import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect, notFound } from "next/navigation";
import { getCustomerSession } from "@/lib/customer-auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Detalhes do Pedido | CB Suplementos",
};

interface PageProps {
  params: Promise<{ numero: string }>;
}

const timelineSteps = [
  { key: "PENDING", label: "Pedido recebido", description: "Aguardando pagamento", icon: "📝" },
  { key: "PAYMENT_APPROVED", label: "Pagamento confirmado", description: "Seu pedido será preparado em breve", icon: "✅" },
  { key: "PROCESSING", label: "Em preparação", description: "Estamos separando seus produtos", icon: "📦" },
  { key: "SHIPPED", label: "Enviado", description: "Seu pedido está a caminho", icon: "🚚" },
  { key: "DELIVERED", label: "Entregue", description: "Pedido entregue com sucesso", icon: "🏠" },
];

// Status index for progress
function getProgressIndex(status: string): number {
  const order = ["PENDING", "PAYMENT_APPROVED", "PROCESSING", "SHIPPED", "DELIVERED"];
  return order.indexOf(status);
}

export default async function PedidoDetailPage({ params }: PageProps) {
  const session = await getCustomerSession();
  if (!session) redirect("/conta/login");

  const { numero } = await params;

  const order = await prisma.order.findUnique({
    where: { orderNumber: numero },
    include: {
      items: true,
      address: true,
    },
  });

  if (!order || order.customerId !== session.id) notFound();

  const fmt = (v: unknown) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));

  const progressIdx = getProgressIndex(order.status);
  const isCancelled = order.status === "CANCELLED" || order.status === "REFUNDED";

  return (
    <section className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/minha-conta/pedidos" className="text-sm text-amber-600 hover:text-amber-700">
            ← Meus pedidos
          </Link>
          <div className="flex flex-wrap items-baseline gap-3 mt-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-neutral-900">
              Pedido {order.orderNumber}
            </h1>
          </div>
          <p className="text-sm text-neutral-500 mt-1">
            Realizado em {new Date(order.createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
            })}
          </p>
        </div>

        {/* TIMELINE */}
        {isCancelled ? (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6 text-center">
            <div className="text-4xl mb-2">❌</div>
            <h2 className="text-lg font-bold text-red-900">
              Pedido {order.status === "REFUNDED" ? "reembolsado" : "cancelado"}
            </h2>
            <p className="text-sm text-red-800 mt-1">
              Se precisar de ajuda, entre em contato pelo WhatsApp.
            </p>
          </div>
        ) : (
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-neutral-200 mb-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-6">Status do pedido</h2>

            {/* Desktop: timeline horizontal */}
            <div className="hidden sm:block">
              <div className="relative">
                {/* Linha de fundo */}
                <div className="absolute top-5 left-5 right-5 h-0.5 bg-neutral-200" />
                {/* Linha de progresso */}
                <div
                  className="absolute top-5 left-5 h-0.5 bg-green-500 transition-all duration-500"
                  style={{ width: `calc(${(progressIdx / (timelineSteps.length - 1)) * 100}% - 1.25rem)` }}
                />
                {/* Steps */}
                <div className="relative flex justify-between">
                  {timelineSteps.map((step, idx) => {
                    const isComplete = idx <= progressIdx;
                    const isCurrent = idx === progressIdx;
                    return (
                      <div key={step.key} className="flex flex-col items-center" style={{ width: `${100 / timelineSteps.length}%` }}>
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center text-lg
                          transition-all
                          ${isComplete
                            ? "bg-green-500 text-white"
                            : "bg-neutral-200 text-neutral-400"
                          }
                          ${isCurrent ? "ring-4 ring-green-100 scale-110" : ""}
                        `}>
                          {isComplete ? "✓" : step.icon}
                        </div>
                        <p className={`mt-2 text-xs font-medium text-center px-1 ${isComplete ? "text-neutral-900" : "text-neutral-400"}`}>
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {progressIdx >= 0 && (
                <div className="mt-6 pt-6 border-t border-neutral-100">
                  <p className="text-sm text-neutral-600">
                    <strong>{timelineSteps[progressIdx]?.label}</strong> — {timelineSteps[progressIdx]?.description}
                  </p>
                </div>
              )}
            </div>

            {/* Mobile: timeline vertical */}
            <div className="sm:hidden space-y-4">
              {timelineSteps.map((step, idx) => {
                const isComplete = idx <= progressIdx;
                const isCurrent = idx === progressIdx;
                return (
                  <div key={step.key} className="flex gap-3 items-start">
                    <div className={`
                      flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg
                      ${isComplete ? "bg-green-500 text-white" : "bg-neutral-200 text-neutral-400"}
                      ${isCurrent ? "ring-4 ring-green-100" : ""}
                    `}>
                      {isComplete ? "✓" : step.icon}
                    </div>
                    <div className="flex-1 pt-2">
                      <p className={`text-sm font-medium ${isComplete ? "text-neutral-900" : "text-neutral-400"}`}>
                        {step.label}
                      </p>
                      {isCurrent && (
                        <p className="text-xs text-neutral-600 mt-0.5">{step.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Rastreio */}
        {order.trackingCode && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 mb-6">
            <p className="text-sm font-medium text-purple-900 mb-1">📮 Código de rastreio</p>
            <p className="font-mono text-lg font-bold text-purple-700">{order.trackingCode}</p>
            <p className="text-xs text-purple-600 mt-2">
              Use esse código para acompanhar a entrega no site dos Correios ou da transportadora.
            </p>
          </div>
        )}

        {/* PIX pendente */}
        {order.status === "PENDING" && order.paymentMethod === "pix" && order.notes && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5 mb-6">
            <p className="text-sm font-medium text-amber-900 mb-2">⏳ Pagamento pendente</p>
            <p className="text-xs text-amber-800 mb-3">
              Seu Pix ainda não foi recebido. Conclua o pagamento para que possamos preparar seu pedido.
            </p>
            <Link
              href={`/checkout/sucesso?pedido=${order.orderNumber}&metodo=pix`}
              className="inline-block px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Ver QR Code Pix
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Itens */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Itens do pedido</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-3 items-start">
                  <div className="relative w-16 h-20 rounded overflow-hidden bg-neutral-100 flex-shrink-0">
                    <Image src={item.productImage} alt={item.productName} fill sizes="64px" className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900">{item.productName}</p>
                    {item.variantName && <p className="text-xs text-neutral-500">{item.variantName}</p>}
                    <p className="text-xs text-neutral-500 mt-1">Qtd: {item.quantity} × {fmt(item.unitPrice)}</p>
                  </div>
                  <p className="text-sm font-semibold whitespace-nowrap">{fmt(Number(item.unitPrice) * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Valores */}
            <div className="bg-white p-5 rounded-xl border border-neutral-200">
              <h3 className="font-semibold text-neutral-900 mb-3">Resumo</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-neutral-600">Subtotal</span><span>{fmt(order.subtotal)}</span></div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Frete ({order.shippingMethod || "—"})</span>
                  <span>{Number(order.shippingCost) === 0 ? "Grátis" : fmt(order.shippingCost)}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-bold text-base"><span>Total</span><span>{fmt(order.total)}</span></div>
              </div>
            </div>

            {/* Endereço */}
            {order.address && (
              <div className="bg-white p-5 rounded-xl border border-neutral-200">
                <h3 className="font-semibold text-neutral-900 mb-2 text-sm">Endereço de entrega</h3>
                <div className="text-sm text-neutral-700 leading-relaxed">
                  <p>{order.address.street}, {order.address.number}</p>
                  {order.address.complement && <p className="text-neutral-500">{order.address.complement}</p>}
                  <p>{order.address.neighborhood}</p>
                  <p>{order.address.city} — {order.address.state}</p>
                  <p className="text-neutral-500 text-xs mt-1">CEP: {order.address.cep}</p>
                </div>
              </div>
            )}

            {/* Loja 100% online — sem retirada física.
                Bloco mantido apenas como salvaguarda para pedidos antigos. */}
            {order.shippingMethod === "RETIRADA" && (
              <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl">
                <h3 className="font-semibold text-amber-900 mb-1 text-sm">📦 Retirada</h3>
                <p className="text-xs text-amber-700 mt-2">
                  Entraremos em contato pelo WhatsApp com os detalhes da retirada.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Ajuda */}
        <div className="mt-8 text-center">
          <a
            href={`https://wa.me/559199266197?text=${encodeURIComponent(`Olá! Preciso de ajuda com o pedido ${order.orderNumber}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-amber-600 hover:text-amber-700"
          >
            Precisa de ajuda? Fale conosco pelo WhatsApp →
          </a>
        </div>
      </div>
    </section>
  );
}

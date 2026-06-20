"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";

function SuccessContent() {
  const params = useSearchParams();
  const pedido = params.get("pedido") || "";
  const metodo = params.get("metodo") || "";

  const [copied, setCopied] = useState(false);
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pixCode, setPixCode] = useState("");
  const [ticketUrl, setTicketUrl] = useState("");

  const fetchOrderData = useCallback(async () => {
    if (!pedido) return;
    try {
      const res = await fetch(`/api/orders/check?numero=${pedido}`);
      if (!res.ok) return;
      const data = await res.json();

      if (data.paid) {
        setPaid(true);
      }

      if (data.pixData) {
        if (data.pixData.qrCode) setPixCode(data.pixData.qrCode);
        if (data.pixData.ticketUrl) setTicketUrl(data.pixData.ticketUrl);
      }

      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [pedido]);

  // Fetch inicial + polling a cada 5s
  useEffect(() => {
    fetchOrderData();

    if (metodo === "pix") {
      const interval = setInterval(fetchOrderData, 5000);
      return () => clearInterval(interval);
    }
  }, [fetchOrderData, metodo]);

  function copyPix() {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // URL para gerar QR Code a partir do código Pix copia-e-cola
  // Usa api.qrserver.com (gratuito, confiável) em vez do base64 do MP
  const qrImageUrl = pixCode
    ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(pixCode)}&size=300x300&format=png`
    : "";

  if (loading) {
    return (
      <section className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-neutral-300 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-500">Carregando pedido...</p>
        </div>
      </section>
    );
  }

  // ============ PAGAMENTO CONFIRMADO ============
  if (paid) {
    return (
      <section className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-green-700 mb-2">
            Pagamento confirmado!
          </h1>
          <p className="text-neutral-600 mb-6">
            Pedido <strong>{pedido}</strong> recebido. Em breve entraremos em contato
            para combinar a entrega.
          </p>
          <Link href="/produtos" className="block py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800">
            Continuar comprando
          </Link>
        </div>
      </section>
    );
  }

  // ============ PIX AGUARDANDO PAGAMENTO ============
  if (metodo === "pix") {
    return (
      <section className="min-h-screen bg-neutral-50 py-8 px-4">
        <div className="max-w-md mx-auto">
          {/* Header com status amarelo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium mb-4">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              Aguardando pagamento
            </div>
            <h1 className="text-2xl font-bold font-display text-neutral-900 mb-1">
              Pedido criado
            </h1>
            <p className="text-sm text-neutral-500">Número: <strong>{pedido}</strong></p>
          </div>

          {/* Alerta */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-900 font-medium mb-1">
              ⚠️ Seu pedido ainda não foi pago
            </p>
            <p className="text-xs text-amber-800">
              Conclua o pagamento via Pix abaixo. Sem o pagamento confirmado,
              seu pedido será cancelado em 30 minutos.
            </p>
          </div>

          {/* QR Code gerado a partir do código Pix */}
          {qrImageUrl && (
            <div className="bg-white p-6 rounded-xl border border-neutral-200 mb-4 text-center">
              <h2 className="text-base font-semibold text-neutral-900 mb-3">
                Escaneie o QR Code
              </h2>
              <div className="w-[250px] h-[250px] mx-auto mb-3 bg-white p-2 rounded-lg border border-neutral-200">
                <img
                  src={qrImageUrl}
                  alt="QR Code Pix"
                  width={250}
                  height={250}
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-xs text-neutral-500">
                Abra o app do seu banco → Pix → Pagar com QR Code
              </p>
            </div>
          )}

          {/* Código copia-e-cola */}
          {pixCode && (
            <div className="bg-white p-4 rounded-xl border border-neutral-200 mb-4">
              <p className="text-sm font-medium text-neutral-700 mb-2">
                Ou copie o código Pix:
              </p>
              <div className="bg-neutral-50 p-3 rounded-lg break-all text-xs text-neutral-700 font-mono mb-3 max-h-24 overflow-y-auto">
                {pixCode}
              </div>
              <button
                onClick={copyPix}
                className={`w-full py-3 rounded-lg text-sm font-semibold transition-colors ${
                  copied ? "bg-green-600 text-white" : "bg-neutral-900 text-white hover:bg-neutral-800"
                }`}
              >
                {copied ? "✓ Copiado!" : "Copiar código Pix"}
              </button>
            </div>
          )}

          {/* Link alternativo do MP */}
          {ticketUrl && (
            <div className="mb-4 text-center">
              <a
                href={ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-amber-600 underline hover:text-amber-700"
              >
                Ou pague pelo site do Mercado Pago →
              </a>
            </div>
          )}

          {/* Status polling */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-blue-800">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              Aguardando confirmação automática...
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Esta página atualiza sozinha quando o pagamento for confirmado.
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link href="/produtos" className="text-sm text-neutral-500 underline">
              Voltar aos produtos
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // ============ OUTRO MÉTODO ============
  return (
    <section className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-5xl mb-4">📋</div>
        <h1 className="text-2xl font-bold font-display text-neutral-900 mb-2">Pedido criado</h1>
        <p className="text-neutral-600 mb-6">Número: <strong>{pedido}</strong></p>
        <Link href="/produtos" className="block py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800">
          Voltar aos produtos
        </Link>
      </div>
    </section>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Carregando...</p></div>}>
      <SuccessContent />
    </Suspense>
  );
}

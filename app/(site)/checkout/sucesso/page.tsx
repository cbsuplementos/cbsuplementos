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
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pixCode, setPixCode] = useState("");

  const fetchOrderData = useCallback(async () => {
    if (!pedido) return;
    try {
      const res = await fetch(`/api/orders/check?numero=${pedido}`);
      if (!res.ok) return;
      const data = await res.json();

      if (data.paid) {
        setPaid(true);
      }

      if (data.expired || data.status === "CANCELLED") {
        setExpired(true);
      }

      if (data.pixData) {
        if (data.pixData.qrCode) setPixCode(data.pixData.qrCode);
      }

      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [pedido]);

  // Fetch inicial
  useEffect(() => {
    fetchOrderData();
  }, [fetchOrderData]);

  // Polling a cada 5s — para automaticamente quando o pedido é pago ou expira
  useEffect(() => {
    if (metodo !== "pix") return;
    if (paid || expired) return;
    const interval = setInterval(fetchOrderData, 5000);
    return () => clearInterval(interval);
  }, [metodo, paid, expired, fetchOrderData]);

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
      <section className="min-h-screen bg-noir flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/15 border-t-gold rounded-full animate-spin mx-auto mb-4" />
          <p className="text-cool-gray">Carregando pedido...</p>
        </div>
      </section>
    );
  }

  // ============ PAGAMENTO CONFIRMADO ============
  if (paid) {
    return (
      <section className="min-h-screen bg-noir flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-green-700 mb-2">
            Pagamento confirmado!
          </h1>
          <p className="text-cool-gray mb-6">
            Pedido <strong>{pedido}</strong> recebido. Em breve entraremos em contato
            para combinar a entrega.
          </p>
          <div className="space-y-3">
            <Link href="/minha-conta/pedidos" className="block py-3 bg-gold text-noir font-bold uppercase tracking-wider rounded-lg hover:bg-gold-light">
              Meus pedidos
            </Link>
            <Link href="/produtos" className="block py-3 border border-gold/40 text-gold font-bold uppercase tracking-wider rounded-lg hover:bg-gold/10 transition-colors">
              Continuar comprando
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // ============ PEDIDO EXPIRADO / CANCELADO ============
  if (expired) {
    return (
      <section className="min-h-screen bg-noir flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">⌛</div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-white mb-2">
            Pedido cancelado
          </h1>
          <p className="text-cool-gray mb-6">
            O pagamento do pedido <strong>{pedido}</strong> não foi confirmado a
            tempo e ele foi cancelado automaticamente. Você pode refazer a compra
            quando quiser.
          </p>
          <div className="space-y-3">
            <Link href="/produtos" className="block py-3 bg-gold text-noir font-bold uppercase tracking-wider rounded-lg hover:bg-gold-light">
              Comprar novamente
            </Link>
            <Link href="/minha-conta/pedidos" className="block py-3 border border-gold/40 text-gold font-bold uppercase tracking-wider rounded-lg hover:bg-gold/10 transition-colors">
              Meus pedidos
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // ============ PIX AGUARDANDO PAGAMENTO ============
  if (metodo === "pix") {
    return (
      <section className="min-h-screen bg-noir py-8 px-4">
        <div className="max-w-md mx-auto">
          {/* Header com status amarelo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/15 text-gold-light rounded-full text-sm font-medium mb-4">
              <div className="w-2 h-2 bg-gold rounded-full animate-pulse" />
              Aguardando pagamento
            </div>
            <h1 className="text-2xl font-bold font-display text-white mb-1">
              Pedido criado
            </h1>
            <p className="text-sm text-cool-gray">Número: <strong>{pedido}</strong></p>
          </div>

          {/* Aviso amigável */}
          <div className="bg-gold/10 border border-gold/30 rounded-xl p-4 mb-6">
            <p className="text-sm text-gold-light font-medium mb-1">
              Falta pouco! Conclua o pagamento via Pix
            </p>
            <p className="text-xs text-cool-gray">
              É só escanear o QR Code ou copiar o código abaixo. Caso o pagamento
              não seja efetuado, o pedido será cancelado automaticamente em 30 minutos.
            </p>
          </div>

          {/* QR Code gerado a partir do código Pix */}
          {qrImageUrl && (
            <div className="bg-charcoal p-6 rounded-xl border border-gold/15 mb-4 text-center">
              <h2 className="text-base font-semibold text-white mb-3">
                Escaneie o QR Code
              </h2>
              <div className="w-[250px] h-[250px] mx-auto mb-3 bg-white p-2 rounded-lg border border-gold/15">
                <img
                  src={qrImageUrl}
                  alt="QR Code Pix"
                  width={250}
                  height={250}
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-xs text-cool-gray">
                Abra o app do seu banco → Pix → Pagar com QR Code
              </p>
            </div>
          )}

          {/* Código copia-e-cola */}
          {pixCode && (
            <div className="bg-charcoal p-4 rounded-xl border border-gold/15 mb-4">
              <p className="text-sm font-medium text-white/80 mb-2">
                Ou copie o código Pix:
              </p>
              <div className="bg-noir p-3 rounded-lg break-all text-xs text-white/80 font-mono mb-3 max-h-24 overflow-y-auto">
                {pixCode}
              </div>
              <button
                onClick={copyPix}
                className={`w-full py-3 rounded-lg text-sm font-semibold transition-colors ${
                  copied ? "bg-green-600 text-white" : "bg-gold text-noir hover:bg-gold-light"
                }`}
              >
                {copied ? "✓ Copiado!" : "Copiar código Pix"}
              </button>
            </div>
          )}

          {/* Status polling */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-blue-300">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              Aguardando confirmação automática...
            </div>
            <p className="text-xs text-blue-400/80 mt-1">
              Esta página atualiza sozinha quando o pagamento for confirmado.
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link href="/produtos" className="text-sm text-cool-gray underline">
              Voltar aos produtos
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // ============ OUTRO MÉTODO ============
  return (
    <section className="min-h-screen bg-noir flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-5xl mb-4">📋</div>
        <h1 className="text-2xl font-bold font-display text-white mb-2">Pedido criado</h1>
        <p className="text-cool-gray mb-6">Número: <strong>{pedido}</strong></p>
        <Link href="/produtos" className="block py-3 bg-gold text-noir font-bold uppercase tracking-wider rounded-lg hover:bg-gold-light">
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

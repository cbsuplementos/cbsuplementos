"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";

interface CartItemData {
  id: string; quantity: number;
  product: { id: string; name: string; price: string; mainImage: string; weight: number; width: number; height: number; length: number };
  variant: { id: string; name: string; price: string } | null;
}
interface ShippingOption { service: string; name: string; price: number; deadline: string }
interface AddressData { cep: string; street: string; number: string; complement: string; neighborhood: string; city: string; state: string }
interface SavedAddress {
  id: string; label: string; recipientName: string; cep: string;
  street: string; number: string; complement: string | null;
  neighborhood: string; city: string; state: string;
}

export default function CheckoutPage() {
  const { customer, refreshCart } = useCart();
  const router = useRouter();
  const [items, setItems] = useState<CartItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  // Endereços salvos
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);

  const [address, setAddress] = useState<AddressData>({ cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "" });
  const [cepLoading, setCepLoading] = useState(false);

  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<"pix" | "credit_card">("pix");

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  // Carregar carrinho + endereços salvos
  useEffect(() => {
    if (!customer) { router.push("/conta/login"); return; }

    Promise.all([
      fetch("/api/cart").then(r => r.json()),
      fetch("/api/address").then(r => r.json()),
    ]).then(([cartData, addrData]) => {
      setItems(cartData.cart?.items || []);
      const addrs = addrData.addresses || [];
      setSavedAddresses(addrs);
      // Se tem endereço salvo, pré-selecionar o primeiro
      if (addrs.length > 0) {
        setSelectedSavedId(addrs[0].id);
      } else {
        setUseNewAddress(true);
      }
      setLoading(false);
    });
  }, [customer, router]);

  const subtotal = items.reduce((sum, item) => {
    const price = item.variant ? Number(item.variant.price) : Number(item.product.price);
    return sum + price * item.quantity;
  }, 0);
  const shippingCost = selectedShipping?.price || 0;
  const total = subtotal + shippingCost;

  // Calcular frete para um CEP
  const calcShipping = useCallback(async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setCepLoading(true);
    setError("");
    setShippingOptions([]);
    setSelectedShipping(null);

    try {
      const res = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cep: cleanCep,
          items: items.map(i => ({ weight: i.product.weight, width: i.product.width, height: i.product.height, length: i.product.length, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      if (data.address && useNewAddress) {
        setAddress(prev => ({
          ...prev,
          street: data.address.street || prev.street,
          neighborhood: data.address.neighborhood || prev.neighborhood,
          city: data.address.city || "",
          state: data.address.state || "",
        }));
      }
      setShippingOptions(data.options || []);
    } catch { setError("Erro ao consultar CEP"); }
    finally { setCepLoading(false); }
  }, [items, useNewAddress]);

  // Quando seleciona endereço salvo → calcular frete automaticamente
  useEffect(() => {
    if (selectedSavedId && !useNewAddress) {
      const saved = savedAddresses.find(a => a.id === selectedSavedId);
      if (saved) {
        setAddress({
          cep: saved.cep,
          street: saved.street,
          number: saved.number,
          complement: saved.complement || "",
          neighborhood: saved.neighborhood,
          city: saved.city,
          state: saved.state,
        });
        calcShipping(saved.cep);
      }
    }
  }, [selectedSavedId, useNewAddress, savedAddresses, calcShipping]);

  // Auto-lookup CEP no novo endereço — dispara ao completar 8 dígitos
  function handleCepChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    let masked = digits;
    if (digits.length > 5) masked = `${digits.slice(0, 5)}-${digits.slice(5)}`;
    setAddress(p => ({ ...p, cep: masked }));

    if (digits.length === 8) {
      calcShipping(digits);
    }
  }

  async function handleCheckout() {
    if (selectedShipping?.service !== "RETIRADA") {
      if (!address.cep || !address.street || !address.number || !address.neighborhood) {
        setError("Preencha todos os campos do endereço.");
        return;
      }
    }

    setProcessing(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: selectedShipping?.service !== "RETIRADA" ? address : null,
          shippingMethod: selectedShipping?.service || "RETIRADA",
          shippingCost: selectedShipping?.price || 0,
          shippingDeadline: selectedShipping?.deadline || "",
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erro ao processar"); setProcessing(false); return; }

      await refreshCart();
      router.push(`/checkout/sucesso?pedido=${data.orderNumber}&metodo=${paymentMethod}`);
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setProcessing(false);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-white/50">Carregando...</p></div>;
  if (items.length === 0) return <div className="min-h-screen flex items-center justify-center flex-col gap-4"><p className="text-white/50">Carrinho vazio.</p><a href="/produtos" className="text-gold underline">Ver produtos</a></div>;

  return (
    <section className="min-h-screen bg-noir">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-white mb-8">Checkout</h1>

        {error && <div className="mb-6 p-4 bg-red-50 text-red-800 text-sm rounded-lg border border-red-200">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">

            {/* 1. ENDEREÇO + FRETE */}
            <div className="bg-charcoal p-6 rounded-xl border border-gold/15">
              <h2 className="text-lg font-semibold text-white mb-4">1. Endereço e frete</h2>

              {/* Endereços salvos */}
              {savedAddresses.length > 0 && (
                <div className="space-y-2 mb-4">
                  {savedAddresses.map(addr => (
                    <label
                      key={addr.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedSavedId === addr.id && !useNewAddress
                          ? "border-gold bg-gold/10"
                          : "border-gold/15 hover:border-white/15"
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedSavedId === addr.id && !useNewAddress}
                        onChange={() => { setSelectedSavedId(addr.id); setUseNewAddress(false); }}
                        className="w-4 h-4 text-gold mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wider bg-charcoal text-cool-gray px-1.5 py-0.5 rounded">
                            {addr.label}
                          </span>
                        </div>
                        <p className="text-sm text-white mt-1">
                          {addr.street}, {addr.number}{addr.complement ? ` — ${addr.complement}` : ""}
                        </p>
                        <p className="text-xs text-cool-gray">
                          {addr.neighborhood} — {addr.city}/{addr.state}
                        </p>
                      </div>
                    </label>
                  ))}

                  {/* Opção: novo endereço */}
                  <label
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      useNewAddress ? "border-gold bg-gold/10" : "border-gold/15 hover:border-white/15"
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={useNewAddress}
                      onChange={() => {
                        setUseNewAddress(true);
                        setSelectedSavedId(null);
                        setAddress({ cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "" });
                        setShippingOptions([]);
                        setSelectedShipping(null);
                      }}
                      className="w-4 h-4 text-gold"
                    />
                    <span className="text-sm font-medium text-white/80">Usar outro endereço</span>
                  </label>
                </div>
              )}

              {/* CEP manual (novo endereço ou sem endereços salvos) */}
              {useNewAddress && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-white/80 mb-1">CEP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={9}
                    value={address.cep}
                    onChange={e => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                    className="w-full max-w-xs px-4 py-3 bg-noir border border-white/15 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-gold"
                  />
                  {cepLoading && <p className="text-xs text-gold mt-1 animate-pulse">Calculando frete...</p>}
                </div>
              )}

              {/* Opções de envio */}
              {shippingOptions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-white/80 mb-2">Opções de envio:</p>
                  {shippingOptions.map(opt => (
                    <label key={opt.service} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${selectedShipping?.service === opt.service ? "border-gold bg-gold/10" : "border-gold/15 hover:border-white/15"}`}>
                      <div className="flex items-center gap-3">
                        <input type="radio" name="shipping" checked={selectedShipping?.service === opt.service}
                          onChange={() => setSelectedShipping(opt)} className="w-4 h-4 text-gold" />
                        <div>
                          <p className="text-sm font-medium text-white">{opt.name}</p>
                          <p className="text-xs text-cool-gray">{opt.deadline}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-white">{opt.price === 0 ? "Grátis" : fmt(opt.price)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* 2. ENDEREÇO DETALHADO — só se novo endereço + não retirada */}
            {useNewAddress && selectedShipping && selectedShipping.service !== "RETIRADA" && (
              <div className="bg-charcoal p-6 rounded-xl border border-gold/15">
                <h2 className="text-lg font-semibold text-white mb-4">2. Endereço de entrega</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-white/80 mb-1">Rua *</label>
                    <input type="text" required value={address.street} onChange={e => setAddress(p => ({ ...p, street: e.target.value }))}
                      className="w-full px-4 py-3 bg-noir border border-white/15 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-gold" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Número *</label>
                    <input type="text" required value={address.number} onChange={e => setAddress(p => ({ ...p, number: e.target.value }))}
                      className="w-full px-4 py-3 bg-noir border border-white/15 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-gold" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Complemento</label>
                    <input type="text" value={address.complement} onChange={e => setAddress(p => ({ ...p, complement: e.target.value }))}
                      placeholder="Apto, bloco..."
                      className="w-full px-4 py-3 bg-noir border border-white/15 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-gold" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Bairro *</label>
                    <input type="text" required value={address.neighborhood} onChange={e => setAddress(p => ({ ...p, neighborhood: e.target.value }))}
                      className="w-full px-4 py-3 bg-noir border border-white/15 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-gold" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Cidade / UF</label>
                    <input type="text" readOnly value={address.city ? `${address.city} — ${address.state}` : ""}
                      className="w-full px-4 py-3 border border-white/15 rounded-lg bg-noir/50 text-cool-gray" />
                  </div>
                </div>
              </div>
            )}

            {/* PAGAMENTO */}
            {selectedShipping && (
              <div className="bg-charcoal p-6 rounded-xl border border-gold/15">
                <h2 className="text-lg font-semibold text-white mb-4">
                  {useNewAddress && selectedShipping.service !== "RETIRADA" ? "3." : "2."} Pagamento
                </h2>
                <div className="flex gap-3 mb-6">
                  <button onClick={() => setPaymentMethod("pix")}
                    className={`flex-1 py-3 rounded-lg text-sm font-medium border transition-colors ${paymentMethod === "pix" ? "border-green-500 bg-green-500/15 text-green-400" : "border-gold/15 text-cool-gray"}`}>
                    Pix
                  </button>
                  <button onClick={() => setPaymentMethod("credit_card")} disabled
                    className="flex-1 py-3 rounded-lg text-sm font-medium border border-gold/15 text-white/50 cursor-not-allowed">
                    Cartão (em breve)
                  </button>
                </div>

                <div className="text-center py-3 px-4 bg-gold/10 rounded-lg border border-gold/30 mb-4">
                  <p className="text-sm text-gold-light">
                    {paymentMethod === "pix"
                      ? "Após confirmar, você receberá o QR Code do Pix para pagar."
                      : "Pagamento com cartão em breve."}
                  </p>
                </div>

                <button onClick={handleCheckout} disabled={processing || paymentMethod === "credit_card"}
                  className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-semibold text-lg rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {processing ? "Processando..." : `Pagar ${fmt(total)}`}
                </button>

                {/* Trust Badges */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5 text-cool-gray">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span className="text-[11px] font-medium">Conexão segura</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-cool-gray">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                      <span className="text-[11px] font-medium">Pix protegido</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-cool-gray">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                        <rect width="20" height="14" x="2" y="5" rx="2" />
                        <line x1="2" x2="22" y1="10" y2="10" />
                      </svg>
                      <span className="text-[11px] font-medium">Mercado Pago</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-center text-white/50 mt-2">
                    Seus dados são criptografados e protegidos
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* RESUMO */}
          <div className="bg-charcoal p-6 rounded-xl border border-gold/15 h-fit sticky top-24">
            <h2 className="text-lg font-semibold text-white mb-4">Resumo</h2>
            <div className="space-y-3 mb-4">
              {items.map(item => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative w-12 h-14 rounded overflow-hidden bg-charcoal flex-shrink-0">
                    <Image src={item.product.mainImage} alt={item.product.name} fill sizes="48px" className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-white line-clamp-1">{item.product.name}</p>
                    {item.variant && <p className="text-[10px] text-cool-gray">{item.variant.name}</p>}
                    <p className="text-xs text-cool-gray">Qtd: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
            <hr className="mb-3" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-cool-gray">Subtotal</span><span>{fmt(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-cool-gray">Frete</span><span>{selectedShipping ? (shippingCost === 0 ? "Grátis" : fmt(shippingCost)) : "—"}</span></div>
              <hr />
              <div className="flex justify-between text-base font-bold"><span>Total</span><span>{fmt(total)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

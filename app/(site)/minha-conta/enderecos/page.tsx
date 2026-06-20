"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";

interface Address {
  id: string;
  label: string;
  recipientName: string;
  cep: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
}

export default function EnderecosPage() {
  const { customer } = useCart();
  const router = useRouter();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Formulário
  const [cep, setCep] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepFound, setCepFound] = useState(false);
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [label, setLabel] = useState("Casa");

  useEffect(() => {
    if (!customer) { router.push("/conta/login"); return; }
    fetchAddresses();
  }, [customer, router]);

  async function fetchAddresses() {
    try {
      const res = await fetch("/api/address");
      const data = await res.json();
      setAddresses(data.addresses || []);
    } catch { /* silenciar */ }
    finally { setLoading(false); }
  }

  // Auto-lookup de CEP — dispara ao completar 8 dígitos
  const lookupCep = useCallback(async (rawCep: string) => {
    const digits = rawCep.replace(/\D/g, "");
    if (digits.length !== 8) return;

    setCepLoading(true);
    setCepFound(false);
    setError("");

    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();

      if (data.erro) {
        setError("CEP não encontrado.");
        setCepLoading(false);
        return;
      }

      setStreet(data.logradouro || "");
      setNeighborhood(data.bairro || "");
      setCity(data.localidade || "");
      setState(data.uf || "");
      setRecipientName(customer?.name || "");
      setCepFound(true);
    } catch {
      setError("Erro ao consultar CEP. Tente novamente.");
    } finally {
      setCepLoading(false);
    }
  }, [customer]);

  function handleCepChange(value: string) {
    // Aplica máscara 00000-000
    const digits = value.replace(/\D/g, "").slice(0, 8);
    let masked = digits;
    if (digits.length > 5) {
      masked = `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }
    setCep(masked);

    // Auto-lookup quando atinge 8 dígitos
    if (digits.length === 8) {
      lookupCep(digits);
    } else {
      setCepFound(false);
    }
  }

  async function handleSave() {
    if (!street || !number || !neighborhood || !city || !state) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          recipientName: recipientName || customer?.name,
          cep: cep.replace(/\D/g, ""),
          street, number, complement, neighborhood, city, state,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error); setSaving(false); return; }

      // Resetar formulário e recarregar lista
      resetForm();
      setShowForm(false);
      await fetchAddresses();
    } catch {
      setError("Erro ao salvar endereço.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja excluir este endereço?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/address/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setDeleting(null); return; }
      setAddresses(prev => prev.filter(a => a.id !== id));
    } catch {
      setError("Erro ao excluir endereço.");
    } finally {
      setDeleting(null);
    }
  }

  function resetForm() {
    setCep(""); setStreet(""); setNumber(""); setComplement("");
    setNeighborhood(""); setCity(""); setState(""); setRecipientName("");
    setLabel("Casa"); setCepFound(false); setError("");
  }

  function formatCep(cep: string) {
    const d = cep.replace(/\D/g, "");
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-400">Carregando...</p>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-neutral-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-6">
          <Link href="/minha-conta" className="text-sm text-amber-600 hover:text-amber-700">
            ← Voltar
          </Link>
          <div className="flex items-center justify-between mt-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-neutral-900">
              Endereços
            </h1>
            {!showForm && (
              <button
                onClick={() => { resetForm(); setShowForm(true); }}
                className="px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-colors"
              >
                Adicionar endereço
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-800 text-sm rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {/* Formulário de novo endereço */}
        {showForm && (
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-neutral-200 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-neutral-900">Adicionar endereço</h2>
              <button
                onClick={() => { setShowForm(false); resetForm(); }}
                className="text-sm text-neutral-500 hover:text-neutral-700"
              >
                Cancelar
              </button>
            </div>

            <div className="space-y-4">
              {/* CEP */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">CEP *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={cep}
                  onChange={(e) => handleCepChange(e.target.value)}
                  placeholder="00000-000"
                  className="w-full max-w-xs px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {cepLoading && (
                  <p className="text-xs text-amber-600 mt-1 animate-pulse">Buscando endereço...</p>
                )}
                <a
                  href="https://buscacepinter.correios.com.br/app/endereco/index.php"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-amber-600 hover:text-amber-700 underline mt-1 inline-block"
                >
                  Não sei meu CEP
                </a>
              </div>

              {/* Campos de endereço — aparecem após CEP encontrado */}
              {cepFound && (
                <>
                  {/* Endereço resumido */}
                  <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                    <p className="text-sm text-neutral-900 font-medium">{street}</p>
                    <p className="text-sm text-neutral-600">
                      {neighborhood} — {city} — {state}
                      <button
                        type="button"
                        onClick={() => setCepFound(true)}
                        className="text-amber-600 hover:text-amber-700 ml-2 text-xs underline"
                      >
                        Editar
                      </button>
                    </p>
                  </div>

                  {/* Rua (editável) */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Rua *</label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Número + Complemento */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Número *</label>
                      <input
                        type="text"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        placeholder="Nº"
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Complemento</label>
                      <input
                        type="text"
                        value={complement}
                        onChange={(e) => setComplement(e.target.value)}
                        placeholder="Apto, bloco..."
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {/* Bairro */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Bairro *</label>
                    <input
                      type="text"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Cidade + Estado (preenchidos automaticamente) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Cidade</label>
                      <input
                        type="text"
                        value={city}
                        readOnly
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Estado</label>
                      <input
                        type="text"
                        value={state}
                        readOnly
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-600"
                      />
                    </div>
                  </div>

                  {/* Destinatário */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Destinatário *</label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Nome de quem vai receber"
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Label (apelido) */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Identificação</label>
                    <select
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      className="w-full max-w-xs px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    >
                      <option value="Casa">Casa</option>
                      <option value="Trabalho">Trabalho</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>

                  {/* Botão salvar */}
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-3.5 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? "Salvando..." : "Adicionar endereço"}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Lista de endereços */}
        {addresses.length === 0 && !showForm ? (
          <div className="bg-white p-12 rounded-xl border border-neutral-200 text-center">
            <div className="text-5xl mb-4">📍</div>
            <p className="text-lg text-neutral-400">
              Você não tem nenhum endereço cadastrado!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="bg-white p-5 rounded-xl border border-neutral-200 hover:border-neutral-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wider bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">
                        {addr.label}
                      </span>
                      <span className="text-xs text-neutral-400">{formatCep(addr.cep)}</span>
                    </div>
                    <p className="text-sm font-medium text-neutral-900">
                      {addr.street}, {addr.number}
                      {addr.complement ? ` — ${addr.complement}` : ""}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {addr.neighborhood} — {addr.city}/{addr.state}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      Destinatário: {addr.recipientName}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDelete(addr.id)}
                    disabled={deleting === addr.id}
                    className="ml-3 p-2 text-neutral-400 hover:text-red-500 transition-colors"
                    aria-label="Excluir endereço"
                  >
                    {deleting === addr.id ? (
                      <span className="text-xs">...</span>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

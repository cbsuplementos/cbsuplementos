"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { useCart } from "@/contexts/CartContext";
import { formatCPF, validateCPF, formatPhone, formatDate, parseDateBR } from "@/lib/cpf";

export default function CustomerRegisterPage() {
  const router = useRouter();
  const { refreshSession } = useCart();

  // Campos do formulário
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Estado de validação
  const [cpfTouched, setCpfTouched] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Validação de CPF em tempo real
  const cpfDigits = cpf.replace(/\D/g, "");
  const cpfComplete = cpfDigits.length === 11;
  const cpfValid = cpfComplete && validateCPF(cpf);

  // Requisitos de senha
  const pwdChecks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    noSpaces: !/\s/.test(password),
  };
  const passwordStrong = Object.values(pwdChecks).every(Boolean);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  // Formulário válido?
  const isFormValid =
    cpfValid &&
    email.trim() !== "" &&
    name.trim() !== "" &&
    passwordStrong &&
    passwordsMatch &&
    acceptTerms;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setError("");

    // Parse date
    const parsedDate = birthDate ? parseDateBR(birthDate) : null;

    const res = await fetch("/api/customer/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.replace(/\D/g, "") || null,
        cpf: cpfDigits,
        birthDate: parsedDate?.toISOString() || null,
        gender: gender || null,
        password,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      setLoading(false);
      return;
    }

    await refreshSession();
    router.push("/produtos");
  }

  return (
    <section className="min-h-screen bg-neutral-50 py-8 sm:py-12 px-4">
      <div className="w-full max-w-lg mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" aria-label="CB Suplementos">
            <Logo variant="compact" className="h-12 w-auto" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-neutral-900 mt-6">
            Cadastro
          </h1>
          <p className="mt-2 text-neutral-500 text-sm text-center">
            Acesse os seus pedidos, facilite as suas compras e tenha uma experiência personalizada.
          </p>
        </div>

        {/* Formulário */}
        <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-neutral-200">
          {error && (
            <div className="mb-5 p-3 bg-red-50 text-red-800 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* CPF */}
            <div>
              <label htmlFor="cpf" className="block text-sm font-medium text-neutral-700 mb-1">
                CPF
              </label>
              <div className="relative">
                <input
                  id="cpf"
                  type="text"
                  inputMode="numeric"
                  required
                  value={cpf}
                  placeholder="000.000.000-00"
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                  onBlur={() => setCpfTouched(true)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors pr-10 ${
                    cpfTouched && cpfComplete
                      ? cpfValid
                        ? "border-green-400 focus:ring-green-400"
                        : "border-red-400 focus:ring-red-400"
                      : "border-neutral-300 focus:ring-amber-500"
                  }`}
                />
                {/* Ícone de validação */}
                {cpfTouched && cpfComplete && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {cpfValid ? (
                      <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </span>
                )}
              </div>
              {cpfTouched && cpfComplete && !cpfValid && (
                <p className="text-xs text-red-500 mt-1">CPF inválido. Verifique os números digitados.</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                placeholder="seu@email.com"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Nome completo */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
                Nome Completo
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                placeholder="Seu nome completo"
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Telefone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-1">
                Telefone
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                placeholder="(91) 99999-9999"
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Data de nascimento + Gênero lado a lado */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="birthDate" className="block text-sm font-medium text-neutral-700 mb-1">
                  Data de Nascimento
                </label>
                <input
                  id="birthDate"
                  type="text"
                  inputMode="numeric"
                  value={birthDate}
                  placeholder="DD/MM/AAAA"
                  onChange={(e) => setBirthDate(formatDate(e.target.value))}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-neutral-700 mb-1">
                  Gênero
                </label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white appearance-none"
                >
                  <option value="">Selecione</option>
                  <option value="feminino">Feminino</option>
                  <option value="masculino">Masculino</option>
                  <option value="outro">Outro</option>
                  <option value="nao-informar">Prefiro não informar</option>
                </select>
              </div>
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Requisitos de senha */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-neutral-500 font-medium mb-1">Sua senha deve conter:</p>
                  <PwdCheck ok={pwdChecks.length} label="No mínimo 8 caracteres" />
                  <PwdCheck ok={pwdChecks.upper} label="Letras maiúsculas" />
                  <PwdCheck ok={pwdChecks.lower} label="Letras minúsculas" />
                  <PwdCheck ok={pwdChecks.number} label="Números" />
                  <PwdCheck ok={pwdChecks.noSpaces} label="Sem espaços em branco" />
                </div>
              )}
            </div>

            {/* Confirmar senha */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-1">
                Confirmar Senha
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 pr-12 ${
                    confirmPassword.length > 0
                      ? passwordsMatch
                        ? "border-green-400 focus:ring-green-400"
                        : "border-red-400 focus:ring-red-400"
                      : "border-neutral-300 focus:ring-amber-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1"
                  aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-xs text-red-500 mt-1">As senhas não coincidem.</p>
              )}
            </div>

            {/* Termos */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded border-neutral-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-neutral-600 leading-snug">
                  Ao finalizar o cadastro eu concordo com a{" "}
                  <Link href="/privacidade" className="text-amber-600 hover:text-amber-700 underline">
                    Política de Privacidade
                  </Link>{" "}
                  e os Termos e Condições.
                </span>
              </label>
            </div>

            {/* Botão submit */}
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="w-full py-3.5 bg-neutral-900 text-white font-semibold rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Criando conta..." : "Criar conta"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-500">
            Já tem conta?{" "}
            <Link href="/conta/login" className="text-amber-600 hover:text-amber-700 font-medium">
              Entrar
            </Link>
          </p>
        </div>

        {/* Redes sociais */}
        <div className="mt-8 text-center">
          <p className="text-sm text-neutral-500 mb-3">A gente se encontra na</p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://www.instagram.com/cb_suplementos_oficial"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-amber-50 hover:text-amber-600 transition-colors"
              aria-label="Instagram"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </a>
            <a
              href="https://wa.me/559199266197"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-green-50 hover:text-green-600 transition-colors"
              aria-label="WhatsApp"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* Componente auxiliar: check de requisito de senha */
function PwdCheck({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-green-500" : "bg-neutral-300"}`} />
      <span className={`text-xs ${ok ? "text-green-600" : "text-neutral-400"}`}>{label}</span>
    </div>
  );
}

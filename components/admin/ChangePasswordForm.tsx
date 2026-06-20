"use client";

import { useState } from "react";

/**
 * ChangePasswordForm — Formulário de troca de senha
 *
 * Segurança:
 * - Pede a senha atual (previne acesso não autorizado se a sessão ficou aberta)
 * - Validação de confirmação no client (UX) + validação no server (segurança)
 * - Feedback visual de sucesso/erro
 * - Limpa os campos após sucesso
 */
export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    // Validação client-side
    if (newPassword.length < 8) {
      setStatus("error");
      setMessage("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("As senhas não conferem.");
      return;
    }

    if (currentPassword === newPassword) {
      setStatus("error");
      setMessage("A nova senha deve ser diferente da atual.");
      return;
    }

    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Erro ao alterar a senha.");
        return;
      }

      setStatus("success");
      setMessage("Senha alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setStatus("error");
      setMessage("Erro de conexão. Tente novamente.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
      {/* Feedback */}
      {message && (
        <div
          className={`p-4 rounded-lg text-sm font-medium ${
            status === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message}
        </div>
      )}

      {/* Senha atual */}
      <div>
        <label htmlFor="current-password" className="block text-sm font-medium text-neutral-700 mb-1">
          Senha atual
        </label>
        <input
          id="current-password"
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full px-4 py-3 border border-neutral-300 rounded-lg text-neutral-900
                     focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          placeholder="Digite sua senha atual"
        />
      </div>

      {/* Nova senha */}
      <div>
        <label htmlFor="new-password" className="block text-sm font-medium text-neutral-700 mb-1">
          Nova senha
        </label>
        <input
          id="new-password"
          type="password"
          required
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full px-4 py-3 border border-neutral-300 rounded-lg text-neutral-900
                     focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          placeholder="Mínimo 8 caracteres"
        />
      </div>

      {/* Confirmar nova senha */}
      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-neutral-700 mb-1">
          Confirmar nova senha
        </label>
        <input
          id="confirm-password"
          type="password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-3 border border-neutral-300 rounded-lg text-neutral-900
                     focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          placeholder="Repita a nova senha"
        />
      </div>

      {/* Botão */}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full px-6 py-3 bg-neutral-900 hover:bg-neutral-800 
                   text-white font-semibold rounded-lg
                   transition-colors duration-200 
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "loading" ? "Alterando..." : "Alterar senha"}
      </button>
    </form>
  );
}

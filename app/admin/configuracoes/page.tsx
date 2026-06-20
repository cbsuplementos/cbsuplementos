import { Metadata } from "next";
import ChangePasswordForm from "@/components/admin/ChangePasswordForm";

export const metadata: Metadata = {
  title: "Configurações | Admin CB Suplementos",
};

/**
 * /admin/configuracoes — Tela de troca de senha
 *
 * Acessível apenas para usuários autenticados (protegida pelo layout admin + middleware).
 * Formulário interativo (Client Component) com validação dupla:
 * - Client: UX rápido (campos obrigatórios, match de senhas)
 * - Server: segurança real (verifica senha atual com bcrypt)
 */
export default function ConfiguracoesPage() {
  return (
    <div>
      {/* Header da página */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
          Configurações
        </h1>
        <p className="mt-1 text-neutral-500">
          Gerencie suas credenciais de acesso ao painel.
        </p>
      </div>

      {/* Card de troca de senha */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-neutral-900 mb-1">
          Alterar Senha
        </h2>
        <p className="text-sm text-neutral-500 mb-6">
          Para sua segurança, informe a senha atual antes de definir uma nova.
        </p>

        <ChangePasswordForm />
      </div>
    </div>
  );
}

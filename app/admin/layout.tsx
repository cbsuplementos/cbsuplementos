import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminSidebar from "@/components/admin/Sidebar";

/**
 * Layout do Painel Admin
 *
 * Verificação dupla de segurança:
 * 1. Middleware já protege as rotas /admin/* (redireciona se não logado)
 * 2. Este layout faz uma segunda verificação como camada extra
 *
 * Por que verificar de novo aqui:
 * - Defesa em profundidade — se o middleware falhar, ainda há proteção
 * - Disponibiliza o `session` para todos os componentes filhos
 * - Permite saudação personalizada ("Olá, Val") no Header
 *
 * Layout visual:
 * - Sidebar fixa à esquerda (256px em desktop, drawer em mobile)
 * - Conteúdo principal ocupa o resto da tela
 * - Sem Header/Footer do site público (route group isola tudo)
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <AdminSidebar user={session.user} />

      {/* Área de conteúdo principal */}
      <main className="flex-1 lg:ml-64">
        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}

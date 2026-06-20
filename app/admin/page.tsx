import { redirect } from "next/navigation";

/**
 * /admin → /admin/dashboard
 *
 * Quando o usuário acessa /admin diretamente, redireciona
 * para o dashboard. Mais UX-friendly do que mostrar 404.
 */
export default function AdminIndexPage() {
  redirect("/admin/dashboard");
}

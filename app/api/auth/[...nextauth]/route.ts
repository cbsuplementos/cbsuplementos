import { handlers } from "@/lib/auth";

/**
 * Route Handler do NextAuth
 *
 * Este arquivo expõe automaticamente todos os endpoints necessários:
 * - POST /api/auth/signin       → fazer login
 * - POST /api/auth/signout      → fazer logout
 * - GET  /api/auth/session      → obter sessão atual
 * - GET  /api/auth/csrf         → token CSRF
 * - GET  /api/auth/providers    → lista de providers
 *
 * Não precisa modificar — toda a lógica está em lib/auth.ts
 */
export const { GET, POST } = handlers;

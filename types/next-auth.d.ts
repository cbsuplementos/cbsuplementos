import { DefaultSession } from "next-auth";

/**
 * Extensão dos tipos do NextAuth
 *
 * Por padrão, session.user só tem name, email, image.
 * Adicionamos `id` e `role` para uso em toda a aplicação.
 *
 * Sem este arquivo, o TypeScript reclamaria ao acessar session.user.id
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

/**
 * Configuração do NextAuth v5 (Auth.js)
 *
 * Estratégia: JWT (não usa session no banco)
 * - Mais rápido (zero queries para validar sessão)
 * - Funciona perfeitamente com Server Components
 * - Stateless: a sessão vive no cookie (HTTP-only, seguro)
 *
 * Fluxo de autenticação:
 * 1. Usuário envia email/senha na tela de login
 * 2. `authorize()` busca o usuário no banco
 * 3. bcrypt compara a senha enviada com o hash armazenado
 * 4. Se válido, retorna o objeto user → NextAuth cria o JWT
 * 5. JWT é salvo em cookie e usado em requests subsequentes
 *
 * O `auth()` exportado é usado em:
 * - Server Components (verificar se está logado)
 * - middleware.ts (proteger rotas)
 * - Route Handlers (APIs autenticadas)
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  // Páginas customizadas (sobrepõem as padrão do NextAuth)
  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  },

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        // Validação básica de presença
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        // Busca o usuário no banco
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() },
        });

        if (!user) {
          return null;
        }

        // Compara a senha com o hash armazenado
        const passwordMatches = await bcrypt.compare(password, user.password);

        if (!passwordMatches) {
          return null;
        }

        // Retorno define o que vai dentro do JWT
        // NUNCA inclua a senha aqui!
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    /**
     * jwt() roda toda vez que um JWT é criado ou atualizado.
     * Aqui adicionamos campos customizados (id, role) ao token.
     */
    async jwt({ token, user }) {
  if (user) {
    token.id = user.id as string;
    token.role = (user as { role: string }).role;
  }
  return token;
},

    /**
     * session() roda quando o cliente chama `auth()` ou `useSession()`.
     * Aqui copiamos os campos do token para o objeto session.user
     * que será acessível em toda a aplicação.
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },

  // Logs em dev, silencioso em produção
  debug: process.env.NODE_ENV === "development",
});

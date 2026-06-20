"use client";

import { SessionProvider } from "next-auth/react";

/**
 * AuthProvider — wrapper do SessionProvider do NextAuth
 *
 * Necessário no Root Layout para que Client Components consigam
 * usar useSession(), signIn(), signOut().
 *
 * "use client" obrigatório porque SessionProvider usa Context API.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

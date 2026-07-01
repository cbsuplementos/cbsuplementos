import type { Metadata, Viewport } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Layout do app de gestão (PWA instalável).
 * - Protegido: exige login (ADMIN ou STAFF). O middleware também barra,
 *   este guard é a segunda camada (server-side).
 * - Mobile-first, tema escuro da marca CB. Instala na tela inicial.
 */

export const metadata: Metadata = {
  title: "CB Gestão — Estoque",
  description: "Consulta e controle de estoque — CB Suplementos.",
  manifest: "/gestao.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CB Gestão",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function GestaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/gestao");

  const name = (session.user as { name?: string }).name ?? "Equipe";

  return (
    <div className="min-h-dvh bg-noir text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-noir/95 backdrop-blur supports-[backdrop-filter]:bg-noir/80">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <Link href="/gestao" className="flex items-center gap-2.5">
            <Image
              src="/logo/cb-icon-96.png"
              alt=""
              width={32}
              height={32}
              className="rounded-md"
            />
            <div className="leading-none">
              <div className="font-display text-xl tracking-wide text-gold">CB Gestão</div>
              <div className="mt-0.5 font-sans text-[11px] uppercase tracking-widest text-cool-gray">
                Estoque
              </div>
            </div>
          </Link>
          <div className="text-right">
            <div className="font-sans text-xs text-cool-gray">Olá,</div>
            <div className="font-sans text-sm font-medium">{name.split(" ")[0]}</div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-24 pt-4">{children}</main>
    </div>
  );
}

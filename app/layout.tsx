import type { Metadata } from "next";
import { Inter, Bebas_Neue, Oswald } from "next/font/google";
import Script from "next/script";
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

/**
 * ROOT LAYOUT — app/layout.tsx
 *
 * Este é o layout raiz que envolve TODA a aplicação (site + admin + login).
 * Responsável por:
 * - Fontes otimizadas (Inter + Bebas Neue + Oswald)
 * - Metadata SEO global
 * - Schema.org Store (loja virtual de suplementos)
 * - AuthProvider (contexto de sessão para Client Components)
 * - Tag <html> e <body>
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bebas",
});

const oswald = Oswald({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-oswald",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cbsuplementos.up.railway.app"),
  title: {
    default: "CB Suplementos | Viva seu melhor corpo",
    template: "%s | CB Suplementos",
  },
  description:
    "CB Suplementos — Whey, Creatina, Pré-Treino, BCAA e muito mais. Produtos 100% originais com entrega para todo o Brasil. Viva seu melhor corpo, supere seus limites.",
  keywords: [
    "CB Suplementos",
    "suplementos",
    "whey protein",
    "creatina",
    "pré-treino",
    "BCAA",
    "termogênico",
    "loja de suplementos online",
    "suplementos originais",
  ],
  authors: [{ name: "CB Suplementos" }],
  creator: "CB Suplementos",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/logo/cb-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/logo/cb-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/logo/cb-icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://cbsuplementos.up.railway.app",
    siteName: "CB Suplementos",
    title: "CB Suplementos | Viva seu melhor corpo",
    description:
      "Suplementos 100% originais com entrega para todo o Brasil. Whey, Creatina, Pré-Treino e mais. Supere seus limites.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CB Suplementos | Viva seu melhor corpo",
    description: "Suplementos originais com entrega para todo Brasil. Supere seus limites.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
};

/**
 * Schema.org — OnlineStore (loja virtual)
 * Sem endereço físico (postalAddress) porque é 100% online.
 */
const storeSchema = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  name: "CB Suplementos",
  image: "https://cbsuplementos.up.railway.app/opengraph-image",
  "@id": "https://cbsuplementos.up.railway.app",
  url: "https://cbsuplementos.up.railway.app",
  telephone: "+559199266197",
  priceRange: "R$$",
  description:
    "Loja virtual de suplementos esportivos. Whey, Creatina, Pré-Treino, BCAA e muito mais. Produtos 100% originais.",
  sameAs: ["https://www.instagram.com/cb_suplementos_oficial"],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+559199266197",
    contactType: "customer service",
    areaServed: "BR",
    availableLanguage: ["Portuguese"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${bebas.variable} ${oswald.variable}`}
    >
      <body className="font-sans bg-noir text-white antialiased">
        <AuthProvider>{children}</AuthProvider>
        <Script
          id="schema-online-store"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(storeSchema),
          }}
        />
      </body>
    </html>
  );
}

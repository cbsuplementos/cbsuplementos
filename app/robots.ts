import { MetadataRoute } from "next";

/**
 * robots.ts — Instrui crawlers sobre o que indexar
 *
 * Regras:
 * - Permite tudo no site público
 * - Bloqueia /admin/* (não deve aparecer no Google)
 * - Bloqueia /login (não relevante para SEO)
 * - Bloqueia /api/* (endpoints internos)
 * - Aponta para o sitemap dinâmico
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://cbsuplementos.up.railway.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/login", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

import { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

// Força geração dinâmica — o sitemap consulta o banco em runtime,
// não durante o build (onde o banco Railway não está acessível).
export const dynamic = "force-dynamic";

/**
 * sitemap.ts — Geração dinâmica do sitemap.xml
 *
 * Acessível em: https://cbsuplementos.up.railway.app/sitemap.xml
 *
 * O que faz:
 * - Lista todas as páginas estáticas (home, sobre, contato, produtos)
 * - Busca todos os produtos ativos no banco e inclui suas URLs
 * - Atualiza automaticamente quando novos produtos são cadastrados
 *
 * SEO:
 * - priority: 1.0 (home) > 0.9 (listagem) > 0.8 (detalhe) > 0.5 (institucionais)
 * - changeFrequency: indica pro Google com que frequência revisitar
 * - lastModified: usa a data de atualização real do banco
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://cbsuplementos.up.railway.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Páginas estáticas — sempre presentes, independente do banco
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/produtos`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/sobre`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/contato`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/politica-privacidade`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/conta/login`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/conta/cadastro`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  try {
    // Em runtime o banco está acessível — inclui produtos e categorias
    // Em build time no Railway o banco NÃO está acessível — o catch retorna só as estáticas
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: { active: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.category.findMany({
        where: { active: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    const productPages: MetadataRoute.Sitemap = products.map((product) => ({
      url: `${BASE_URL}/produtos/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
      url: `${BASE_URL}/produtos?categoria=${cat.slug}`,
      lastModified: cat.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [...staticPages, ...productPages, ...categoryPages];
  } catch {
    // Banco indisponível (build time) — retorna só as páginas estáticas
    return staticPages;
  }
}

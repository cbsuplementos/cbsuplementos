import Hero from "@/components/site/Hero";
import CategoryGrid from "@/components/site/CategoryGrid";
import FeaturedProducts from "@/components/site/FeaturedProducts";
import AboutPreview from "@/components/site/AboutPreview";
import BenefitsSection from "@/components/site/BenefitsSection";

/**
 * Home Page — app/(site)/page.tsx
 *
 * `force-dynamic` impede o Next.js de pré-renderizar esta página
 * durante o build. Sem isso, ele tenta buscar dados do banco em
 * build-time, quando o banco interno do Railway ainda não está
 * acessível — causando o erro "Can't reach database server".
 */
export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoryGrid />
      <FeaturedProducts />
      <AboutPreview />
      <BenefitsSection />
    </>
  );
}

import { prisma } from "@/lib/db";
import HeroCarousel from "./HeroCarousel";

/**
 * Hero — Server Component
 *
 * Responsabilidade: buscar slides válidos do banco e passar pro carrossel.
 *
 * Lógica de filtragem:
 * 1. active = true
 * 2. startsAt <= agora (ou nulo)
 * 3. endsAt >= agora (ou nulo)
 * 4. Ordenado por priority ASC
 *
 * Separação Server/Client:
 * - Hero (este): Server — fetch do banco, sem JS no cliente
 * - HeroCarousel: Client — animação, timer, interatividade
 */
export default async function Hero() {
  const now = new Date();

  const slides = await prisma.heroSlide.findMany({
    where: {
      active: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [
        {
          OR: [{ endsAt: null }, { endsAt: { gte: now } }],
        },
      ],
    },
    orderBy: { priority: "asc" },
  });

  return <HeroCarousel slides={slides} />;
}

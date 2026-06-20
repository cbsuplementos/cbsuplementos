import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/admin/FormFields";
import HeroSlideForm from "@/components/admin/HeroSlideForm";

export const dynamic = "force-dynamic";

export default async function EditHeroSlidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const slide = await prisma.heroSlide.findUnique({ where: { id } });
  if (!slide) notFound();

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Editar Slide" description="Atualize as configurações deste banner." />
      <HeroSlideForm
        slide={{
          id: slide.id,
          image: slide.image,
          title: slide.title,
          subtitle: slide.subtitle,
          buttonText: slide.buttonText,
          buttonUrl: slide.buttonUrl,
          buttonTarget: slide.buttonTarget,
          textColor: slide.textColor,
          duration: slide.duration,
          priority: slide.priority,
          startsAt: slide.startsAt,
          endsAt: slide.endsAt,
          active: slide.active,
        }}
      />
    </div>
  );
}

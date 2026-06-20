import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { PageHeader, Button } from "@/components/admin/FormFields";
import HeroSlideActions from "@/components/admin/HeroSlideActions";

export const dynamic = "force-dynamic";

export default async function HeroPage() {
  const slides = await prisma.heroSlide.findMany({
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
  });

  const now = new Date();

  function getSlideStatus(slide: typeof slides[0]) {
    if (!slide.active) return { label: "Pausado", color: "bg-gray-100 text-gray-600" };
    if (slide.endsAt && slide.endsAt < now) return { label: "Expirado", color: "bg-red-50 text-red-700" };
    if (slide.startsAt && slide.startsAt > now) return { label: "Agendado", color: "bg-blue-50 text-blue-700" };
    return { label: "Ativo", color: "bg-green-50 text-green-700" };
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Hero / Banner"
        description="Gerencie os banners que aparecem no topo do site."
        action={
          <Link href="/admin/hero/novo">
            <Button>+ Novo Slide</Button>
          </Link>
        }
      />

      {slides.length === 0 ? (
        <div className="bg-white border border-neutral-200 p-12 text-center">
          <p className="font-display text-2xl text-noir mb-2">Nenhum slide cadastrado</p>
          <p className="text-neutral-500 mb-6">
            Crie slides para o banner principal do site. Enquanto não houver slides, um placeholder elegante é exibido.
          </p>
          <Link href="/admin/hero/novo">
            <Button>+ Criar Primeiro Slide</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {slides.map((slide) => {
            const status = getSlideStatus(slide);
            return (
              <div key={slide.id} className="bg-white border border-neutral-200 p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                {/* Thumbnail */}
                <div className="relative w-full sm:w-32 h-40 sm:h-20 flex-shrink-0 bg-noir/5 overflow-hidden">
                  <Image
                    src={slide.image}
                    alt={slide.title ?? "Slide"}
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-display text-lg text-noir">
                      {slide.title ?? "(sem título)"}
                    </h3>
                    <span className={`px-2 py-0.5 text-[10px] uppercase tracking-widest ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
                    <span>Prioridade: {slide.priority}</span>
                    <span>Duração: {slide.duration}s</span>
                    {slide.startsAt && (
                      <span>Início: {new Date(slide.startsAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span>
                    )}
                    {slide.endsAt && (
                      <span>Fim: {new Date(slide.endsAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span>
                    )}
                    {slide.buttonText && <span>CTA: {slide.buttonText}</span>}
                  </div>
                </div>

                {/* Ações */}
                <HeroSlideActions id={slide.id} active={slide.active} />
              </div>
            );
          })}
        </div>
      )}

      {slides.length > 0 && (
        <p className="mt-4 text-xs text-neutral-500">
          ★ Slides ordenados por prioridade (menor número = aparece primeiro). Slides com agendamento só ficam visíveis no período definido.
        </p>
      )}
    </div>
  );
}

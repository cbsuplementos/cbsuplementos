"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea, Select, Checkbox, Button } from "@/components/admin/FormFields";
import ImageUpload from "@/components/admin/ImageUpload";
import { createHeroSlide, updateHeroSlide } from "@/app/admin/hero/actions";

type Slide = {
  id: string;
  image: string;
  title: string | null;
  subtitle: string | null;
  buttonText: string | null;
  buttonUrl: string | null;
  buttonTarget: "SELF" | "BLANK";
  textColor: "LIGHT" | "DARK";
  duration: number;
  priority: number;
  startsAt: Date | null;
  endsAt: Date | null;
  active: boolean;
};

interface HeroSlideFormProps {
  slide?: Slide;
}

function toDatetimeLocal(date: Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function HeroSlideForm({ slide }: HeroSlideFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [image, setImage] = useState<string>(slide?.image ?? "");
  const isEditing = !!slide;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("image", image);

    startTransition(async () => {
      const result = isEditing
        ? await updateHeroSlide(slide.id, formData)
        : await createHeroSlide(formData);

      if ("error" in result) { setError(result.error); return; }
      router.push("/admin/hero");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {/* Imagem */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-noir border-b border-noir/10 pb-2">Imagem do Banner</h2>
        <div className="max-w-sm">
          <ImageUpload
            label="Imagem (obrigatória)"
            value={image}
            onChange={setImage}
            onRemove={() => setImage("")}
            aspectRatio="landscape"
            hint="Prefira imagens horizontais, mínimo 1200x600px."
          />
        </div>
      </section>

      {/* Conteúdo */}
      <section className="space-y-6">
        <h2 className="font-display text-xl text-noir border-b border-noir/10 pb-2">Conteúdo Sobreposto</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <Input label="Título (opcional)" name="title" defaultValue={slide?.title ?? ""} placeholder="Ex: Coleção Inverno 2026" hint="Aparece em destaque sobre a imagem." />
          <Select
            label="Cor do texto"
            name="textColor"
            defaultValue={slide?.textColor ?? "LIGHT"}
            options={[
              { value: "LIGHT", label: "Branco (para fotos escuras)" },
              { value: "DARK", label: "Preto (para fotos claras)" },
            ]}
          />
        </div>
        <Textarea label="Subtítulo (opcional)" name="subtitle" rows={2} defaultValue={slide?.subtitle ?? ""} placeholder="Uma frase curta e impactante" />
      </section>

      {/* CTA */}
      <section className="space-y-6">
        <h2 className="font-display text-xl text-noir border-b border-noir/10 pb-2">Botão de Ação (CTA)</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          <Input label="Texto do botão" name="buttonText" defaultValue={slide?.buttonText ?? ""} placeholder="Ex: Ver Coleção" />
          <Input label="Link do botão" name="buttonUrl" defaultValue={slide?.buttonUrl ?? ""} placeholder="Ex: /produtos ou https://..." hint="Pode ser link interno ou externo." />
          <Select
            label="Abrir link em"
            name="buttonTarget"
            defaultValue={slide?.buttonTarget ?? "SELF"}
            options={[
              { value: "SELF", label: "Mesma aba" },
              { value: "BLANK", label: "Nova aba" },
            ]}
          />
        </div>
      </section>

      {/* Configurações */}
      <section className="space-y-6">
        <h2 className="font-display text-xl text-noir border-b border-noir/10 pb-2">Configurações do Carrossel</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <Input
            label="Duração (segundos)"
            name="duration"
            type="number"
            min={2}
            max={30}
            defaultValue={slide?.duration ?? 5}
            hint="Tempo que este slide fica visível (2 a 30 segundos)."
          />
          <Input
            label="Prioridade"
            name="priority"
            type="number"
            min={0}
            defaultValue={slide?.priority ?? 0}
            hint="Menor número = aparece primeiro."
          />
        </div>
      </section>

      {/* Agendamento */}
      <section className="space-y-6">
        <h2 className="font-display text-xl text-noir border-b border-noir/10 pb-2">Agendamento (opcional)</h2>
        <p className="text-sm text-neutral-500 -mt-4">
          Deixe em branco para exibir sempre. Preencha para promoções com data de início e fim.
        </p>
        <div className="grid sm:grid-cols-2 gap-6">
          <Input
            label="Início da exibição"
            name="startsAt"
            type="datetime-local"
            defaultValue={toDatetimeLocal(slide?.startsAt ?? null)}
            hint="A partir de quando este slide será exibido."
          />
          <Input
            label="Fim da exibição"
            name="endsAt"
            type="datetime-local"
            defaultValue={toDatetimeLocal(slide?.endsAt ?? null)}
            hint="Após esta data, o slide sai do ar automaticamente."
          />
        </div>
      </section>

      {error && (
        <div role="alert" className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-noir/10">
        <Button type="submit" loading={isPending}>
          {isEditing ? "Salvar Alterações" : "Criar Slide"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/hero")}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

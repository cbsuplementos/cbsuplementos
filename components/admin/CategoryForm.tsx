"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea, Button } from "@/components/admin/FormFields";
import ImageUpload from "@/components/admin/ImageUpload";
import { createCategory, updateCategory } from "@/app/admin/categorias/actions";

interface CategoryFormProps {
  category?: {
    id: string;
    name: string;
    description: string | null;
    image: string | null;
    order: number;
    defaultWeight: number;
    defaultHeight: number;
    defaultWidth: number;
    defaultLength: number;
  };
}

export default function CategoryForm({ category }: CategoryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [image, setImage] = useState<string>(category?.image ?? "");
  const isEditing = !!category;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("image", image);

    startTransition(async () => {
      const result = isEditing
        ? await updateCategory(category.id, formData)
        : await createCategory(formData);

      if ("error" in result) {
        setError(result.error);
        return;
      }

      router.push("/admin/categorias");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Coluna esquerda: dados textuais */}
        <div className="space-y-6">
          <Input
            label="Nome"
            name="name"
            required
            defaultValue={category?.name ?? ""}
            placeholder="Ex: Proteínas"
            hint="O slug da URL será gerado automaticamente."
          />

          <Textarea
            label="Descrição (opcional)"
            name="description"
            rows={4}
            defaultValue={category?.description ?? ""}
            placeholder="Breve descrição que pode aparecer no site"
          />

          <Input
            label="Ordem de exibição"
            name="order"
            type="number"
            min={0}
            defaultValue={category?.order ?? 0}
            hint="Números menores aparecem primeiro."
          />
        </div>

        {/* Coluna direita: imagem */}
        <div>
          <ImageUpload
            label="Imagem da categoria (opcional)"
            value={image}
            onChange={setImage}
            onRemove={() => setImage("")}
            aspectRatio="portrait"
            hint="Imagem que aparece no grid de categorias da Home."
          />
        </div>
      </div>

      {/* ============ SEÇÃO: EMBALAGEM PADRÃO ============ */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-noir border-b border-noir/10 pb-2">
          📦 Embalagem Padrão
        </h2>
        <p className="text-sm text-neutral-500">
          Dimensões e peso padrão para produtos desta categoria. Se um produto não tiver dimensões próprias, estas serão usadas no cálculo do frete.
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Peso (g)"
            name="defaultWeight"
            type="number"
            min={1}
            defaultValue={category?.defaultWeight ?? 300}
            hint="Em gramas"
          />
          <Input
            label="Altura (cm)"
            name="defaultHeight"
            type="number"
            min={1}
            defaultValue={category?.defaultHeight ?? 10}
            hint="Em centímetros"
          />
          <Input
            label="Largura (cm)"
            name="defaultWidth"
            type="number"
            min={1}
            defaultValue={category?.defaultWidth ?? 15}
            hint="Em centímetros"
          />
          <Input
            label="Comprimento (cm)"
            name="defaultLength"
            type="number"
            min={1}
            defaultValue={category?.defaultLength ?? 20}
            hint="Em centímetros"
          />
        </div>
      </section>

      {error && (
        <div role="alert" className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-noir/10">
        <Button type="submit" loading={isPending}>
          {isEditing ? "Salvar Alterações" : "Criar Categoria"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/categorias")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}

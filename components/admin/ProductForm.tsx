"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Input,
  Textarea,
  Select,
  Checkbox,
  Button,
} from "@/components/admin/FormFields";
import ImageUpload from "@/components/admin/ImageUpload";
import VariantForm, { VariantData } from "@/components/admin/VariantForm";
import { createProduct, updateProduct } from "@/app/admin/produtos/actions";

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  categories: Category[];
  product?: {
    id: string;
    name: string;
    description: string;
    price: string;
    mainImage: string;
    categoryId: string;
    stock: number | null;
    badge: string;
    weight: number;
    height: number;
    width: number;
    length: number;
    active: boolean;
    featured: boolean;
    images: { url: string; order: number }[];
    variants: VariantData[];
  };
}

/**
 * Formulário de Produto — usado tanto para criar quanto editar
 *
 * Gerencia:
 * - Imagem principal (obrigatória)
 * - Galeria de imagens (0+, opcional)
 * - Dados textuais (nome, descrição, preço)
 * - Categoria (dropdown)
 * - Flags (ativo, destaque)
 * - Estoque
 */
export default function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!product;

  // Estado das imagens (gerenciado separadamente pelos uploads)
  const [mainImage, setMainImage] = useState<string>(product?.mainImage ?? "");
  const [galleryImages, setGalleryImages] = useState<string[]>(
    product?.images.sort((a, b) => a.order - b.order).map((img) => img.url) ?? []
  );
  const [variants, setVariants] = useState<VariantData[]>(
    product?.variants ?? []
  );

  function addGallerySlot() {
    setGalleryImages([...galleryImages, ""]);
  }

  function updateGalleryImage(index: number, url: string) {
    const newImages = [...galleryImages];
    newImages[index] = url;
    setGalleryImages(newImages);
  }

  function removeGalleryImage(index: number) {
    setGalleryImages(galleryImages.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("mainImage", mainImage);

    // Remove valores antigos de galleryImages e adiciona os atuais
    formData.delete("galleryImages");
    galleryImages
      .filter((url) => url.trim() !== "")
      .forEach((url) => formData.append("galleryImages", url));

    // Serializa variantes como JSON
    formData.delete("variants");
    formData.set("variants", JSON.stringify(variants));

    startTransition(async () => {
      const result = isEditing
        ? await updateProduct(product.id, formData)
        : await createProduct(formData);

      if ("error" in result) {
        setError(result.error);
        return;
      }

      router.push("/admin/produtos");
      router.refresh();
    });
  }

  const categoryOptions = [
    { value: "", label: "Selecione..." },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ============ SEÇÃO: INFORMAÇÕES BÁSICAS ============ */}
      <section className="space-y-6">
        <h2 className="font-display text-xl text-noir border-b border-noir/10 pb-2">
          Informações Básicas
        </h2>

        <div className="grid lg:grid-cols-2 gap-6">
          <Input
            label="Nome do produto"
            name="name"
            required
            defaultValue={product?.name ?? ""}
            placeholder="Ex: Whey Protein Concentrado 900g"
          />

          <Select
            label="Categoria"
            name="categoryId"
            required
            defaultValue={product?.categoryId ?? ""}
            options={categoryOptions}
          />
        </div>

        <Textarea
          label="Descrição"
          name="description"
          required
          rows={5}
          defaultValue={product?.description ?? ""}
          placeholder="Descreva o produto: tecido, caimento, ocasiões de uso..."
        />

        <div className="grid lg:grid-cols-3 gap-6">
          <Input
            label="Preço (R$)"
            name="price"
            type="text"
            inputMode="decimal"
            required
            defaultValue={product?.price ?? ""}
            placeholder="Ex: 289,90"
            hint="Use vírgula ou ponto como separador decimal."
          />

          <Input
            label="Estoque (opcional)"
            name="stock"
            type="number"
            min={0}
            defaultValue={product?.stock ?? 0}
          />

          <Select
            label="Badge (selo)"
            name="badge"
            defaultValue={product?.badge ?? "NONE"}
            options={[
              { value: "NONE", label: "Nenhum" },
              { value: "MAIS_VENDIDO", label: "⭐ Mais Vendido" },
              { value: "NOVIDADE", label: "🆕 Novidade" },
              { value: "PROMOCAO", label: "🏷️ Promoção" },
              { value: "EXCLUSIVO", label: "💎 Exclusivo" },
            ]}
          />
        </div>

        <div className="space-y-3 pt-2">
          <Checkbox
            label="Produto ativo"
            description="Apenas produtos ativos aparecem no site."
            name="active"
            defaultChecked={product?.active ?? true}
          />
          <Checkbox
            label="Marcar como destaque"
            description="Produtos em destaque aparecem na seção principal da Home."
            name="featured"
            defaultChecked={product?.featured ?? false}
          />
        </div>
      </section>

      {/* ============ SEÇÃO: DIMENSÕES E PESO ============ */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-noir border-b border-noir/10 pb-2">
          📦 Dimensões e Peso (para frete)
        </h2>
        <p className="text-sm text-neutral-500">
          Informe o peso e dimensões da embalagem deste produto.
          Deixe <strong>0</strong> para usar os valores padrão da categoria.
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Peso (g)"
            name="weight"
            type="number"
            min={0}
            defaultValue={product?.weight ?? 0}
            hint="Em gramas (0 = herda da categoria)"
          />
          <Input
            label="Altura (cm)"
            name="height"
            type="number"
            min={0}
            defaultValue={product?.height ?? 0}
            hint="Em cm (0 = herda)"
          />
          <Input
            label="Largura (cm)"
            name="width"
            type="number"
            min={0}
            defaultValue={product?.width ?? 0}
            hint="Em cm (0 = herda)"
          />
          <Input
            label="Comprimento (cm)"
            name="length"
            type="number"
            min={0}
            defaultValue={product?.length ?? 0}
            hint="Em cm (0 = herda)"
          />
        </div>
      </section>

      {/* ============ SEÇÃO: IMAGEM PRINCIPAL ============ */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-noir border-b border-noir/10 pb-2">
          Imagem Principal
        </h2>

        <div className="max-w-sm">
          <ImageUpload
            value={mainImage}
            onChange={setMainImage}
            onRemove={() => setMainImage("")}
            aspectRatio="portrait"
            hint="Esta é a imagem que aparece nos cards de produto."
          />
        </div>
      </section>

      {/* ============ SEÇÃO: GALERIA ============ */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-noir border-b border-noir/10 pb-2">
          Galeria (opcional)
        </h2>
        <p className="text-sm text-neutral-500">
          Imagens secundárias que aparecem na página individual do produto.
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {galleryImages.map((url, index) => (
            <div key={index}>
              <ImageUpload
                label={`Imagem ${index + 1}`}
                value={url}
                onChange={(newUrl) => updateGalleryImage(index, newUrl)}
                onRemove={() => removeGalleryImage(index)}
                aspectRatio="portrait"
                hint=""
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addGallerySlot}
          className="text-sm uppercase tracking-widest text-gold-dark hover:text-gold border-b border-gold-dark/50 pb-1"
        >
          + Adicionar imagem à galeria
        </button>
      </section>

      {/* ============ SEÇÃO: VARIANTES ============ */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-noir border-b border-noir/10 pb-2">
          Variantes (opcional)
        </h2>
        <p className="text-sm text-neutral-500">
          Adicione variações como tamanho, cor ou modelo. Cada variante pode ter
          seu próprio preço e estoque.
        </p>

        <VariantForm variants={variants} onChange={setVariants} />
      </section>

      {/* ============ ERRO ============ */}
      {error && (
        <div role="alert" className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* ============ BOTÕES ============ */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-noir/10">
        <Button type="submit" loading={isPending}>
          {isEditing ? "Salvar Alterações" : "Criar Produto"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/produtos")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}

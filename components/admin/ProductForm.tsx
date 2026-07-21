"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
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

interface BrandOption {
  id: string;
  name: string;
}

interface ProductFormProps {
  categories: Category[];
  brands: BrandOption[];
  product?: {
    id: string;
    name: string;
    description: string;
    price: string;
    costPrice: string;
    brandId: string;
    mainImage: string;
    categoryId: string;
    stock: number | null;
    minStock: number;
    badge: string;
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
 * - Imagem principal (obrigatória) e galeria
 * - Dados textuais (nome, descrição)
 * - Preço de venda e custo
 * - Categoria, badge e flags (ativo, destaque)
 * - Variações (sabores, tamanhos, apresentações)
 *
 * ESTOQUE: no cadastro é possível definir o estoque inicial (gera registro
 * de inventário). Na EDIÇÃO o estoque é somente leitura — mudanças passam
 * pelo app de Gestão (/gestao), que registra cada movimentação. Editar
 * estoque por formulário criaria mudanças sem rastro no histórico.
 *
 * A antiga seção "Dimensões e Peso (para frete)" foi ocultada: a entrega é
 * por motoboy com taxa fixa por cidade, então nenhum cálculo usa esses
 * campos. Os valores existentes no banco são preservados.
 */
export default function ProductForm({ categories, brands, product }: ProductFormProps) {
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

  const hasVariants = variants.length > 0;

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

    // Serializa variações como JSON (inclui id para sincronização segura
    // no servidor — variações existentes são ATUALIZADAS, não recriadas)
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

  const brandOptions = [
    { value: "", label: "Sem marca" },
    ...brands.map((b) => ({ value: b.id, label: b.name })),
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

        <div className="grid lg:grid-cols-2 gap-6">
          <Select
            label="Marca (opcional)"
            name="brandId"
            defaultValue={product?.brandId ?? ""}
            options={brandOptions}
          />
          <Input
            label="Ou criar nova marca"
            name="newBrandName"
            placeholder="Ex: Max Titanium"
            hint="Preenchido, cria a marca na hora e a usa neste produto (ignora o campo ao lado)."
          />
        </div>

        <Textarea
          label="Descrição"
          name="description"
          required
          rows={5}
          defaultValue={product?.description ?? ""}
          placeholder="Descreva o produto: sabor, tamanho, benefícios, modo de uso..."
        />

        <div className="grid lg:grid-cols-3 gap-6">
          <Input
            label="Preço de venda (R$)"
            name="price"
            type="text"
            inputMode="decimal"
            required
            defaultValue={product?.price ?? ""}
            placeholder="Ex: 289,90"
            hint="Cobrado no site e exibido no app de Gestão. Vírgula ou ponto."
          />

          <Input
            label="Custo (R$)"
            name="costPrice"
            type="text"
            inputMode="decimal"
            defaultValue={product?.costPrice ?? ""}
            placeholder="Ex: 155,00"
            hint="Quanto você paga no fornecedor (opcional)."
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

        {/* ===== ESTOQUE ===== */}
        {isEditing ? (
          !hasVariants && (
            <div className="space-y-4">
            <div className="grid lg:grid-cols-3 gap-6">
              <Input
                label="Estoque mínimo"
                name="minStock"
                type="number"
                min={0}
                defaultValue={String(product?.minStock ?? 5)}
                hint='Alerta "Repor" quando o estoque ficar igual ou abaixo.'
              />
            </div>
            <div className="rounded-lg bg-neutral-50 border border-noir/10 px-4 py-3">
              <p className="text-sm text-noir/70">
                Estoque atual:{" "}
                <span className="font-semibold text-noir">
                  {product?.stock ?? "sem controle"}
                </span>
                <span className="text-neutral-400">
                  {" "}— ajuste pelo{" "}
                  <Link href="/gestao" className="underline text-gold-dark hover:text-gold" target="_blank">
                    app de Gestão
                  </Link>
                  , que registra cada movimentação no histórico.
                </span>
              </p>
            </div>
            </div>
          )
        ) : (
          !hasVariants && (
            <div className="grid lg:grid-cols-3 gap-6">
              <Input
                label="Estoque inicial (opcional)"
                name="stock"
                type="number"
                min={0}
                defaultValue=""
                placeholder="Ex: 12"
                hint="Vazio = sem controle de estoque (o site vende sem limite). Preenchido, gera registro de inventário inicial."
              />
              <Input
                label="Estoque mínimo"
                name="minStock"
                type="number"
                min={0}
                defaultValue="5"
                hint='Alerta "Repor" quando o estoque ficar igual ou abaixo.'
              />
            </div>
          )
        )}
        {hasVariants && (
          <p className="text-xs text-neutral-500">
            Este produto tem variações — preço, custo e estoque são definidos
            por variação, na seção abaixo.
          </p>
        )}

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

      {/* ============ SEÇÃO: VARIAÇÕES ============ */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-noir border-b border-noir/10 pb-2">
          Variações (opcional)
        </h2>
        <p className="text-sm text-neutral-500">
          Adicione variações como sabor, tamanho do pote ou apresentação.
          Cada variação tem seu próprio preço, custo e estoque.
        </p>

        <VariantForm
          variants={variants}
          onChange={setVariants}
          productEditing={isEditing}
        />
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

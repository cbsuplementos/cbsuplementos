"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";

/**
 * Server Actions de Produtos
 */

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado");
  return session;
}

type ActionResult = { success: true; id?: string } | { error: string };

/**
 * Helper: gera slug único checando duplicidade
 */
async function generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.product.findFirst({
      where: {
        slug,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
    if (!existing) return slug;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

/**
 * Helper: extrai dados do FormData
 */
function parseProductForm(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const priceStr = (formData.get("price") as string)?.replace(",", ".");
  const price = parseFloat(priceStr);
  const mainImage = (formData.get("mainImage") as string)?.trim();
  const categoryId = (formData.get("categoryId") as string)?.trim();
  const stock = parseInt((formData.get("stock") as string) || "0", 10);
  const badge = (formData.get("badge") as string) || "NONE";
  const weight = parseInt((formData.get("weight") as string) || "0", 10);
  const height = parseInt((formData.get("height") as string) || "0", 10);
  const width = parseInt((formData.get("width") as string) || "0", 10);
  const length = parseInt((formData.get("length") as string) || "0", 10);
  const active = formData.get("active") === "on";
  const featured = formData.get("featured") === "on";

  // Imagens da galeria (múltiplos valores)
  const galleryImages = formData.getAll("galleryImages") as string[];

  // Variantes (JSON serializado)
  const variantsRaw = formData.get("variants") as string;
  let variants: {
    id?: string;
    name: string;
    price: string;
    stock: number;
    sku: string;
    active: boolean;
  }[] = [];
  try {
    variants = variantsRaw ? JSON.parse(variantsRaw) : [];
  } catch {
    variants = [];
  }

  return {
    name,
    description,
    price,
    mainImage,
    categoryId,
    stock,
    badge,
    weight,
    height,
    width,
    length,
    active,
    featured,
    galleryImages: galleryImages.filter((url) => url.trim() !== ""),
    variants: variants.filter((v) => v.name.trim() !== ""),
  };
}

/**
 * CRIAR produto
 */
export async function createProduct(formData: FormData): Promise<ActionResult> {
  await requireAuth();

  const data = parseProductForm(formData);

  // Validações
  if (!data.name) return { error: "Nome é obrigatório" };
  if (!data.description) return { error: "Descrição é obrigatória" };
  if (!data.price || data.price <= 0) return { error: "Preço inválido" };
  if (!data.mainImage) return { error: "Imagem principal é obrigatória" };
  if (!data.categoryId) return { error: "Categoria é obrigatória" };

  try {
    const slug = await generateUniqueSlug(data.name);

    // Se dimensões forem 0, herdar da categoria
    let { weight, height, width, length } = data;
    if (weight === 0 || height === 0 || width === 0 || length === 0) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
        select: { defaultWeight: true, defaultHeight: true, defaultWidth: true, defaultLength: true },
      });
      if (category) {
        if (weight === 0) weight = category.defaultWeight;
        if (height === 0) height = category.defaultHeight;
        if (width === 0) width = category.defaultWidth;
        if (length === 0) length = category.defaultLength;
      }
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        price: data.price,
        mainImage: data.mainImage,
        categoryId: data.categoryId,
        stock: data.stock,
        badge: data.badge as "NONE" | "MAIS_VENDIDO" | "NOVIDADE" | "PROMOCAO" | "EXCLUSIVO",
        weight,
        height,
        width,
        length,
        active: data.active,
        featured: data.featured,
        // Cria as imagens da galeria
        images: {
          create: data.galleryImages.map((url, index) => ({
            url,
            alt: data.name,
            order: index,
          })),
        },
        // Cria as variantes
        variants: {
          create: data.variants.map((v) => ({
            name: v.name,
            price: parseFloat(v.price.replace(",", ".")) || data.price,
            stock: v.stock || 0,
            sku: v.sku || null,
            active: v.active,
          })),
        },
      },
    });

    revalidatePath("/admin/produtos");
    revalidatePath("/");
    return { success: true, id: product.id };
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return { error: "Erro ao criar produto" };
  }
}

/**
 * ATUALIZAR produto
 */
export async function updateProduct(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  await requireAuth();

  const data = parseProductForm(formData);

  if (!data.name) return { error: "Nome é obrigatório" };
  if (!data.description) return { error: "Descrição é obrigatória" };
  if (!data.price || data.price <= 0) return { error: "Preço inválido" };
  if (!data.mainImage) return { error: "Imagem principal é obrigatória" };
  if (!data.categoryId) return { error: "Categoria é obrigatória" };

  try {
    const slug = await generateUniqueSlug(data.name, id);

    // Se dimensões forem 0, herdar da categoria
    let { weight, height, width, length } = data;
    if (weight === 0 || height === 0 || width === 0 || length === 0) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
        select: { defaultWeight: true, defaultHeight: true, defaultWidth: true, defaultLength: true },
      });
      if (category) {
        if (weight === 0) weight = category.defaultWeight;
        if (height === 0) height = category.defaultHeight;
        if (width === 0) width = category.defaultWidth;
        if (length === 0) length = category.defaultLength;
      }
    }

    // Estratégia para galeria e variantes: deletar todas e recriar
    // (mais simples que sincronizar — performance OK para poucos itens)
    await prisma.$transaction([
      prisma.productImage.deleteMany({ where: { productId: id } }),
      prisma.variant.deleteMany({ where: { productId: id } }),
      prisma.product.update({
        where: { id },
        data: {
          name: data.name,
          slug,
          description: data.description,
          price: data.price,
          mainImage: data.mainImage,
          categoryId: data.categoryId,
          stock: data.stock,
          badge: data.badge as "NONE" | "MAIS_VENDIDO" | "NOVIDADE" | "PROMOCAO" | "EXCLUSIVO",
          weight,
          height,
          width,
          length,
          active: data.active,
          featured: data.featured,
          images: {
            create: data.galleryImages.map((url, index) => ({
              url,
              alt: data.name,
              order: index,
            })),
          },
          variants: {
            create: data.variants.map((v) => ({
              name: v.name,
              price: parseFloat(v.price.replace(",", ".")) || data.price,
              stock: v.stock || 0,
              sku: v.sku || null,
              active: v.active,
            })),
          },
        },
      }),
    ]);

    revalidatePath("/admin/produtos");
    revalidatePath("/");
    revalidatePath(`/produtos/${slug}`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    return { error: "Erro ao atualizar produto" };
  }
}

/**
 * ALTERNAR ativo/inativo
 */
export async function toggleProductActive(id: string): Promise<ActionResult> {
  await requireAuth();

  try {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return { error: "Produto não encontrado" };

    await prisma.product.update({
      where: { id },
      data: { active: !product.active },
    });

    revalidatePath("/admin/produtos");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Erro ao alterar status:", error);
    return { error: "Erro ao alterar status" };
  }
}

/**
 * ALTERNAR destaque
 */
export async function toggleProductFeatured(id: string): Promise<ActionResult> {
  await requireAuth();

  try {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return { error: "Produto não encontrado" };

    await prisma.product.update({
      where: { id },
      data: { featured: !product.featured },
    });

    revalidatePath("/admin/produtos");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Erro ao alterar destaque:", error);
    return { error: "Erro ao alterar destaque" };
  }
}

/**
 * DELETAR produto
 *
 * Deleta também as imagens da galeria automaticamente (Cascade no schema).
 */
export async function deleteProduct(id: string): Promise<ActionResult> {
  await requireAuth();

  try {
    await prisma.product.delete({ where: { id } });

    revalidatePath("/admin/produtos");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar produto:", error);
    return { error: "Erro ao deletar produto" };
  }
}

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
/** "155,00" → 155.0 · vazio/inválido → null */
function parseMoney(raw: string | null | undefined): number | null {
  const cleaned = (raw ?? "").trim().replace(",", ".");
  if (cleaned === "") return null;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

/**
 * Resolve a marca do produto: se "newBrandName" foi preenchido, cria/reusa
 * a marca (upsert por slug) e retorna o id; senão usa o select (ou null).
 */
async function resolveBrandId(
  brandId: string,
  newBrandName: string
): Promise<string | null> {
  if (newBrandName) {
    const slug = slugify(newBrandName);
    const brand = await prisma.brand.upsert({
      where: { slug },
      update: {},
      create: { name: newBrandName, slug },
    });
    return brand.id;
  }
  return brandId || null;
}

function parseProductForm(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const price = parseMoney(formData.get("price") as string) ?? NaN;
  const costPrice = parseMoney(formData.get("costPrice") as string);
  const mainImage = (formData.get("mainImage") as string)?.trim();
  const categoryId = (formData.get("categoryId") as string)?.trim();
  const brandId = ((formData.get("brandId") as string) ?? "").trim();
  const newBrandName = ((formData.get("newBrandName") as string) ?? "")
    .replace(/\s+/g, " ")
    .trim();
  // Estoque inicial (só usado no CADASTRO):
  //   vazio  → null = sem controle de estoque (o site vende sem limite)
  //   número → estoque inicial, com registro de inventário no histórico
  const stockRaw = ((formData.get("stock") as string) ?? "").trim();
  const stock =
    stockRaw === "" ? null : Math.max(0, parseInt(stockRaw, 10) || 0);
  const badge = (formData.get("badge") as string) || "NONE";
  const active = formData.get("active") === "on";
  const featured = formData.get("featured") === "on";

  // Imagens da galeria (múltiplos valores)
  const galleryImages = formData.getAll("galleryImages") as string[];

  // Variações (JSON serializado; id presente = variação já existente)
  const variantsRaw = formData.get("variants") as string;
  let variants: {
    id?: string;
    name: string;
    price: string;
    costPrice?: string;
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
    costPrice,
    mainImage,
    categoryId,
    brandId,
    newBrandName,
    stock,
    badge,
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
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id ?? null;
    const brandId = await resolveBrandId(data.brandId, data.newBrandName);

    // Com variações, o estoque vive nelas — o campo do produto fica nulo.
    const hasVariants = data.variants.length > 0;
    const productStock = hasVariants ? null : data.stock;

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        price: data.price,
        costPrice: data.costPrice,
        // Preço de venda unificado: `resalePrice` é mantido como espelho de
        // `price` (decisão 02/07 — são a mesma coisa).
        resalePrice: data.price,
        mainImage: data.mainImage,
        categoryId: data.categoryId,
        brandId,
        stock: productStock,
        badge: data.badge as "NONE" | "MAIS_VENDIDO" | "NOVIDADE" | "PROMOCAO" | "EXCLUSIVO",
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
        // Cria as variações (estoque inicial permitido só no cadastro)
        variants: {
          create: data.variants.map((v) => {
            const vPrice = parseMoney(v.price) ?? data.price;
            return {
              name: v.name,
              price: vPrice,
              costPrice: parseMoney(v.costPrice),
              resalePrice: vPrice,
              stock: v.stock || 0,
              sku: v.sku || null,
              active: v.active,
            };
          }),
        },
      },
      include: { variants: { select: { id: true, stock: true } } },
    });

    // Estoque inicial vira INVENTARIO_INICIAL no histórico — assim o app de
    // Gestão enxerga de onde o número veio, desde o primeiro dia.
    const initialMovements = hasVariants
      ? product.variants
          .filter((v) => v.stock > 0)
          .map((v) => ({
            type: "INVENTARIO_INICIAL" as const,
            quantity: v.stock,
            stockBefore: 0,
            stockAfter: v.stock,
            reason: "Cadastro do produto (admin)",
            productId: product.id,
            variantId: v.id,
            userId,
          }))
      : productStock && productStock > 0
        ? [
            {
              type: "INVENTARIO_INICIAL" as const,
              quantity: productStock,
              stockBefore: 0,
              stockAfter: productStock,
              reason: "Cadastro do produto (admin)",
              productId: product.id,
              variantId: null,
              userId,
            },
          ]
        : [];
    if (initialMovements.length > 0) {
      await prisma.stockMovement.createMany({ data: initialMovements });
    }

    revalidatePath("/admin/produtos");
    revalidatePath("/");
    return { success: true, id: product.id };
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    if ((error as { code?: string })?.code === "P2002") {
      return { error: "SKU duplicado: cada variação precisa de um SKU único (ou deixe em branco)." };
    }
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
    const brandId = await resolveBrandId(data.brandId, data.newBrandName);

    // ============================================================
    // SINCRONIZAÇÃO DE VARIAÇÕES POR ID (nunca "apagar e recriar")
    // ------------------------------------------------------------
    // A estratégia antiga (deleteMany + create) tinha efeitos graves:
    //  - apagava costPrice/resalePrice das variações a cada salvamento;
    //  - deixava o histórico de estoque órfão (variantId → null);
    //  - trocava os IDs, invalidando carrinhos de clientes e a tela do
    //    /gestao aberta no celular;
    //  - sobrescrevia o estoque com o valor carregado no formulário
    //    (desfazia vendas concorrentes).
    // Agora: existentes são ATUALIZADAS, novas são CRIADAS (estoque 0) e
    // só as removidas no formulário são EXCLUÍDAS — e apenas se estiverem
    // com estoque zerado. Estoque e IDs são preservados.
    // ============================================================
    const existing = await prisma.variant.findMany({
      where: { productId: id },
      select: { id: true, name: true, stock: true },
    });
    const existingIds = new Set(existing.map((v) => v.id));

    const submitted = data.variants.map((v) => ({
      ...v,
      // id desconhecido (ex.: variação excluída por outra pessoa enquanto o
      // formulário estava aberto) é tratado como variação nova
      id: v.id && existingIds.has(v.id) ? v.id : undefined,
    }));
    const submittedIds = new Set(
      submitted.filter((v) => v.id).map((v) => v.id as string)
    );

    const toDelete = existing.filter((v) => !submittedIds.has(v.id));
    const blocked = toDelete.filter((v) => v.stock !== 0);
    if (blocked.length > 0) {
      return {
        error:
          `Não dá para remover variação com estoque: ` +
          blocked.map((v) => `"${v.name}" (${v.stock} un.)`).join(", ") +
          `. Zere o estoque pelo app de Gestão (registrando a saída) e salve de novo.`,
      };
    }

    const toUpdate = submitted.filter((v) => v.id);
    const toCreate = submitted.filter((v) => !v.id);

    await prisma.$transaction([
      // Galeria: recriar é seguro (nenhuma outra tabela referencia imagens)
      prisma.productImage.deleteMany({ where: { productId: id } }),
      prisma.product.update({
        where: { id },
        data: {
          name: data.name,
          slug,
          description: data.description,
          price: data.price,
          costPrice: data.costPrice,
          resalePrice: data.price, // espelho — preço de venda unificado
          mainImage: data.mainImage,
          categoryId: data.categoryId,
          brandId,
          // stock NÃO é tocado aqui: mudanças de estoque passam pelo app de
          // Gestão, que registra a movimentação. Dimensões (peso/altura/etc.)
          // também ficam como estão — o frete é taxa fixa e não as usa.
          badge: data.badge as "NONE" | "MAIS_VENDIDO" | "NOVIDADE" | "PROMOCAO" | "EXCLUSIVO",
          active: data.active,
          featured: data.featured,
          images: {
            create: data.galleryImages.map((url, index) => ({
              url,
              alt: data.name,
              order: index,
            })),
          },
        },
      }),
      ...toDelete.map((v) =>
        prisma.variant.delete({ where: { id: v.id } })
      ),
      ...toUpdate.map((v) => {
        const vPrice = parseMoney(v.price) ?? data.price;
        return prisma.variant.update({
          where: { id: v.id as string },
          data: {
            name: v.name,
            price: vPrice,
            costPrice: parseMoney(v.costPrice),
            resalePrice: vPrice,
            sku: v.sku || null,
            active: v.active,
            // stock preservado — só muda por movimentação registrada
          },
        });
      }),
      ...toCreate.map((v) => {
        const vPrice = parseMoney(v.price) ?? data.price;
        return prisma.variant.create({
          data: {
            productId: id,
            name: v.name,
            price: vPrice,
            costPrice: parseMoney(v.costPrice),
            resalePrice: vPrice,
            sku: v.sku || null,
            active: v.active,
            stock: 0, // nova variação nasce zerada; entrada pelo /gestao
          },
        });
      }),
    ]);

    revalidatePath("/admin/produtos");
    revalidatePath("/");
    revalidatePath(`/produtos/${slug}`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    if ((error as { code?: string })?.code === "P2002") {
      return { error: "SKU duplicado: cada variação precisa de um SKU único (ou deixe em branco)." };
    }
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

/* ================================================================
 * AÇÕES EM MASSA (E5)
 * ----------------------------------------------------------------
 * Uma única entrada de atualização (bulkUpdateProducts) com patch
 * whitelisted, e uma exclusão em massa (bulkDeleteProducts) que só
 * roda quando TODOS os selecionados estão inativos e sem pedidos.
 * ================================================================ */

const BULK_LIMIT = 2000;
const VALID_BADGES = ["NONE", "MAIS_VENDIDO", "NOVIDADE", "PROMOCAO", "EXCLUSIVO"] as const;
type BulkBadge = (typeof VALID_BADGES)[number];

export interface BulkPatch {
  active?: boolean;
  badge?: string;
  categoryId?: string;
  brandId?: string | null;
}

type BulkResult = { success: true; count: number } | { error: string };

function validateIds(ids: unknown): string[] | null {
  if (!Array.isArray(ids) || ids.length === 0) return null;
  if (ids.length > BULK_LIMIT) return null;
  if (!ids.every((i) => typeof i === "string" && i.length > 0)) return null;
  return ids as string[];
}

/**
 * Atualiza um campo em todos os produtos selecionados.
 * Aceita exatamente UMA operação por chamada (ativar/desativar,
 * badge, categoria ou marca) — mantém o resultado previsível.
 */
export async function bulkUpdateProducts(
  rawIds: string[],
  patch: BulkPatch
): Promise<BulkResult> {
  await requireAuth();

  const ids = validateIds(rawIds);
  if (!ids) return { error: "Seleção inválida (vazia ou grande demais)." };

  const data: Record<string, unknown> = {};

  if (typeof patch.active === "boolean") {
    data.active = patch.active;
  } else if (typeof patch.badge === "string") {
    if (!VALID_BADGES.includes(patch.badge as BulkBadge))
      return { error: "Badge inválido." };
    data.badge = patch.badge;
  } else if (typeof patch.categoryId === "string" && patch.categoryId) {
    const cat = await prisma.category.findUnique({
      where: { id: patch.categoryId },
      select: { id: true },
    });
    if (!cat) return { error: "Categoria não encontrada." };
    data.categoryId = patch.categoryId;
  } else if ("brandId" in patch) {
    if (patch.brandId === null) {
      data.brandId = null;
    } else if (typeof patch.brandId === "string" && patch.brandId) {
      const brand = await prisma.brand.findUnique({
        where: { id: patch.brandId },
        select: { id: true },
      });
      if (!brand) return { error: "Marca não encontrada." };
      data.brandId = patch.brandId;
    } else {
      return { error: "Marca inválida." };
    }
  } else {
    return { error: "Nenhuma alteração informada." };
  }

  const result = await prisma.product.updateMany({
    where: { id: { in: ids } },
    data,
  });

  revalidatePath("/admin/produtos");
  revalidatePath("/");
  return { success: true, count: result.count };
}

/**
 * Exclui produtos em massa. Regras de segurança (a mesma do botão
 * individual, em lote):
 *  1. Todos os selecionados precisam estar INATIVOS — força o fluxo
 *     "desativar → conferir a vitrine → excluir".
 *  2. Nenhum pode ter itens de pedido (o histórico de vendas é
 *     preservado; o banco também bloqueia via FK Restrict).
 * Variações e imagens caem em cascata; o ledger de estoque é mantido
 * com referência nula (histórico preservado).
 */
export async function bulkDeleteProducts(rawIds: string[]): Promise<BulkResult> {
  await requireAuth();

  const ids = validateIds(rawIds);
  if (!ids) return { error: "Seleção inválida (vazia ou grande demais)." };

  const [activeCount, orderRefs] = await Promise.all([
    prisma.product.count({ where: { id: { in: ids }, active: true } }),
    prisma.orderItem.count({ where: { productId: { in: ids } } }),
  ]);

  if (activeCount > 0) {
    return {
      error: `${activeCount} do(s) selecionado(s) ainda está(ão) ativo(s). Desative antes de excluir.`,
    };
  }
  if (orderRefs > 0) {
    return {
      error: `Exclusão bloqueada: há ${orderRefs} item(ns) de pedido ligados aos selecionados. Mantenha esses produtos desativados para preservar o histórico.`,
    };
  }

  const result = await prisma.product.deleteMany({ where: { id: { in: ids } } });

  revalidatePath("/admin/produtos");
  revalidatePath("/");
  return { success: true, count: result.count };
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";

/**
 * Server Actions de Categorias
 *
 * Server Actions são funções server-side chamadas direto do client
 * (sem precisar criar API routes). Padrão moderno do Next 15.
 *
 * Vantagens:
 * - Tipagem end-to-end (TypeScript)
 * - Sem necessidade de fetch/axios
 * - Validação acontece no servidor (seguro)
 * - revalidatePath() invalida o cache automaticamente
 */

/**
 * Garante que o usuário está autenticado.
 * Lançar erro aqui derruba a action — segurança em camadas.
 */
async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Não autorizado");
  }
  return session;
}

/**
 * Tipo de retorno padrão das actions.
 * { success: true } ou { error: "mensagem" }
 */
type ActionResult = { success: true } | { error: string };

/**
 * CRIAR categoria
 */
export async function createCategory(formData: FormData): Promise<ActionResult> {
  await requireAuth();

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const image = (formData.get("image") as string)?.trim();
  const order = parseInt((formData.get("order") as string) || "0", 10);
  const defaultWeight = parseInt((formData.get("defaultWeight") as string) || "300", 10);
  const defaultHeight = parseInt((formData.get("defaultHeight") as string) || "10", 10);
  const defaultWidth = parseInt((formData.get("defaultWidth") as string) || "15", 10);
  const defaultLength = parseInt((formData.get("defaultLength") as string) || "20", 10);

  // Validação
  if (!name) {
    return { error: "Nome é obrigatório" };
  }

  const slug = slugify(name);

  try {
    // Verifica duplicidade
    const existing = await prisma.category.findFirst({
      where: { OR: [{ name }, { slug }] },
    });

    if (existing) {
      return { error: "Já existe uma categoria com esse nome" };
    }

    await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
        image: image || null,
        order,
        defaultWeight,
        defaultHeight,
        defaultWidth,
        defaultLength,
      },
    });

    revalidatePath("/admin/categorias");
    revalidatePath("/"); // Home mostra categorias
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    return { error: "Erro ao criar categoria" };
  }
}

/**
 * ATUALIZAR categoria
 */
export async function updateCategory(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  await requireAuth();

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const image = (formData.get("image") as string)?.trim();
  const order = parseInt((formData.get("order") as string) || "0", 10);
  const defaultWeight = parseInt((formData.get("defaultWeight") as string) || "300", 10);
  const defaultHeight = parseInt((formData.get("defaultHeight") as string) || "10", 10);
  const defaultWidth = parseInt((formData.get("defaultWidth") as string) || "15", 10);
  const defaultLength = parseInt((formData.get("defaultLength") as string) || "20", 10);

  if (!name) {
    return { error: "Nome é obrigatório" };
  }

  const slug = slugify(name);

  try {
    // Verifica duplicidade (exceto a própria categoria)
    const existing = await prisma.category.findFirst({
      where: {
        OR: [{ name }, { slug }],
        NOT: { id },
      },
    });

    if (existing) {
      return { error: "Já existe outra categoria com esse nome" };
    }

    await prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
        description: description || null,
        image: image || null,
        order,
        defaultWeight,
        defaultHeight,
        defaultWidth,
        defaultLength,
      },
    });

    revalidatePath("/admin/categorias");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar categoria:", error);
    return { error: "Erro ao atualizar categoria" };
  }
}

/**
 * ALTERNAR status ativo/inativo
 */
export async function toggleCategoryActive(id: string): Promise<ActionResult> {
  await requireAuth();

  try {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return { error: "Categoria não encontrada" };

    await prisma.category.update({
      where: { id },
      data: { active: !category.active },
    });

    revalidatePath("/admin/categorias");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Erro ao alterar status:", error);
    return { error: "Erro ao alterar status" };
  }
}

/**
 * DELETAR categoria
 *
 * Bloqueado se houver produtos associados (onDelete: Restrict no schema).
 * Cliente precisa mover/deletar produtos antes.
 */
export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireAuth();

  try {
    // Verifica se há produtos vinculados
    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      return {
        error: `Não é possível deletar: ${productCount} produto(s) usam essa categoria. Mova-os primeiro.`,
      };
    }

    await prisma.category.delete({ where: { id } });

    revalidatePath("/admin/categorias");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar categoria:", error);
    return { error: "Erro ao deletar categoria" };
  }
}

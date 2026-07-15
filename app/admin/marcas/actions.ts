"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";

/**
 * Server Actions de Marcas (E1)
 *
 * Regras:
 *  - Nome é único (case-insensitive via slug único).
 *  - Renomear a marca atualiza automaticamente todos os produtos
 *    vinculados (é chave estrangeira — nada a migrar).
 *  - Excluir só é permitido quando NENHUM produto usa a marca;
 *    caso contrário, desative-a.
 */

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado");
  return session;
}

type ActionResult = { success: true } | { error: string };

function normalizeName(raw: FormDataEntryValue | null): string {
  return String(raw ?? "").replace(/\s+/g, " ").trim();
}

export async function createBrand(formData: FormData): Promise<ActionResult> {
  await requireAuth();
  const name = normalizeName(formData.get("name"));
  if (!name) return { error: "Informe o nome da marca." };
  if (name.length > 60) return { error: "Nome muito longo (máx. 60)." };

  const slug = slugify(name);
  const existing = await prisma.brand.findFirst({
    where: { OR: [{ slug }, { name: { equals: name, mode: "insensitive" } }] },
  });
  if (existing) return { error: `Já existe a marca "${existing.name}".` };

  await prisma.brand.create({ data: { name, slug } });
  revalidatePath("/admin/marcas");
  revalidatePath("/admin/produtos");
  return { success: true };
}

export async function renameBrand(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  await requireAuth();
  const name = normalizeName(formData.get("name"));
  if (!name) return { error: "Informe o nome da marca." };

  const slug = slugify(name);
  const clash = await prisma.brand.findFirst({
    where: {
      NOT: { id },
      OR: [{ slug }, { name: { equals: name, mode: "insensitive" } }],
    },
  });
  if (clash) return { error: `Já existe a marca "${clash.name}".` };

  try {
    await prisma.brand.update({ where: { id }, data: { name, slug } });
  } catch {
    return { error: "Erro ao renomear a marca." };
  }
  revalidatePath("/admin/marcas");
  revalidatePath("/admin/produtos");
  return { success: true };
}

export async function toggleBrandActive(id: string): Promise<ActionResult> {
  await requireAuth();
  const brand = await prisma.brand.findUnique({ where: { id } });
  if (!brand) return { error: "Marca não encontrada." };
  await prisma.brand.update({
    where: { id },
    data: { active: !brand.active },
  });
  revalidatePath("/admin/marcas");
  return { success: true };
}

export async function deleteBrand(id: string): Promise<ActionResult> {
  await requireAuth();
  const count = await prisma.product.count({ where: { brandId: id } });
  if (count > 0) {
    return {
      error: `Esta marca está em ${count} produto(s). Reatribua ou remova a marca deles antes de excluir — ou apenas desative-a.`,
    };
  }
  try {
    await prisma.brand.delete({ where: { id } });
  } catch {
    return { error: "Erro ao excluir a marca." };
  }
  revalidatePath("/admin/marcas");
  revalidatePath("/admin/produtos");
  return { success: true };
}

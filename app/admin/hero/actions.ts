"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado");
}

type ActionResult = { success: true } | { error: string };

function parseSlideForm(formData: FormData) {
  const image = (formData.get("image") as string)?.trim();
  const title = (formData.get("title") as string)?.trim() || null;
  const subtitle = (formData.get("subtitle") as string)?.trim() || null;
  const buttonText = (formData.get("buttonText") as string)?.trim() || null;
  const buttonUrl = (formData.get("buttonUrl") as string)?.trim() || null;
  const buttonTarget = formData.get("buttonTarget") === "BLANK" ? "BLANK" : "SELF";
  const textColor = formData.get("textColor") === "DARK" ? "DARK" : "LIGHT";
  const duration = Math.min(30, Math.max(2, parseInt((formData.get("duration") as string) || "5", 10)));
  const priority = parseInt((formData.get("priority") as string) || "0", 10);

  const startsAtRaw = (formData.get("startsAt") as string)?.trim();
  const endsAtRaw = (formData.get("endsAt") as string)?.trim();
  const startsAt = startsAtRaw ? new Date(startsAtRaw) : null;
  const endsAt = endsAtRaw ? new Date(endsAtRaw) : null;

  return { image, title, subtitle, buttonText, buttonUrl, buttonTarget, textColor, duration, priority, startsAt, endsAt };
}

export async function createHeroSlide(formData: FormData): Promise<ActionResult> {
  await requireAuth();

  const data = parseSlideForm(formData);
  if (!data.image) return { error: "Imagem é obrigatória" };

  if (data.startsAt && data.endsAt && data.endsAt <= data.startsAt) {
    return { error: "A data de fim deve ser posterior à data de início" };
  }

  try {
    await prisma.heroSlide.create({ data: data as any });
    revalidatePath("/");
    revalidatePath("/admin/hero");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Erro ao criar slide" };
  }
}

export async function updateHeroSlide(id: string, formData: FormData): Promise<ActionResult> {
  await requireAuth();

  const data = parseSlideForm(formData);
  if (!data.image) return { error: "Imagem é obrigatória" };

  if (data.startsAt && data.endsAt && data.endsAt <= data.startsAt) {
    return { error: "A data de fim deve ser posterior à data de início" };
  }

  try {
    await prisma.heroSlide.update({ where: { id }, data: data as any });
    revalidatePath("/");
    revalidatePath("/admin/hero");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Erro ao atualizar slide" };
  }
}

export async function toggleHeroSlideActive(id: string): Promise<ActionResult> {
  await requireAuth();
  try {
    const slide = await prisma.heroSlide.findUnique({ where: { id } });
    if (!slide) return { error: "Slide não encontrado" };
    await prisma.heroSlide.update({ where: { id }, data: { active: !slide.active } });
    revalidatePath("/");
    revalidatePath("/admin/hero");
    return { success: true };
  } catch (e) {
    return { error: "Erro ao alterar status" };
  }
}

export async function deleteHeroSlide(id: string): Promise<ActionResult> {
  await requireAuth();
  try {
    await prisma.heroSlide.delete({ where: { id } });
    revalidatePath("/");
    revalidatePath("/admin/hero");
    return { success: true };
  } catch (e) {
    return { error: "Erro ao deletar slide" };
  }
}

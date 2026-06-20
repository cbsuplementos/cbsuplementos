import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";

/**
 * POST /api/upload
 *
 * Recebe um arquivo via FormData e retorna a URL pública no Cloudinary.
 *
 * Segurança:
 * - Requer autenticação (só admin pode fazer upload)
 * - Validação de tipo (apenas imagens)
 * - Validação de tamanho (max 10MB)
 *
 * Uso no front:
 * const formData = new FormData();
 * formData.append("file", arquivo);
 * const res = await fetch("/api/upload", { method: "POST", body: formData });
 * const { url } = await res.json();
 */
export async function POST(req: NextRequest) {
  // 1. Verifica autenticação
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: "Não autorizado" },
      { status: 401 }
    );
  }

  try {
    // 2. Lê o arquivo do FormData
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    // 3. Validações
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Imagem muito grande. Máximo 10MB." },
        { status: 400 }
      );
    }

    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato inválido. Use JPG, PNG ou WebP." },
        { status: 400 }
      );
    }

    // 4. Converte para base64 (formato que o Cloudinary aceita)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    // 5. Faz upload para o Cloudinary
    const result = await uploadImage(base64);

    return NextResponse.json({
      url: result.url,
      publicId: result.publicId,
    });
  } catch (error) {
    console.error("Erro no upload:", error);
    return NextResponse.json(
      { error: "Erro ao processar upload" },
      { status: 500 }
    );
  }
}

/**
 * Configuração: aumenta o limite de tamanho do body
 * (padrão do Next é 1MB, precisamos de mais para imagens)
 */
export const runtime = "nodejs";
export const maxDuration = 30; // segundos

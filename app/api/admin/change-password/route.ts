import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

/**
 * POST /api/admin/change-password
 *
 * Troca a senha do usuário autenticado.
 *
 * Segurança:
 * 1. Verifica se há sessão ativa (auth())
 * 2. Busca o usuário no banco pelo email da sessão
 * 3. Compara a senha atual com bcrypt
 * 4. Gera hash da nova senha e salva
 *
 * Body esperado:
 * { currentPassword: string, newPassword: string }
 */
export async function POST(request: Request) {
  try {
    // 1. Verificar autenticação
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    // 2. Extrair dados do body
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Senha atual e nova senha são obrigatórias." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "A nova senha deve ter pelo menos 8 caracteres." },
        { status: 400 }
      );
    }

    // 3. Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado." },
        { status: 404 }
      );
    }

    // 4. Verificar senha atual
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: "Senha atual incorreta." },
        { status: 403 }
      );
    }

    // 5. Hash da nova senha e salvar
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CHANGE_PASSWORD_ERROR]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

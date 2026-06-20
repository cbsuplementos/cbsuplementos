import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-auth";
import { prisma } from "@/lib/db";

// GET — Retorna o carrinho do cliente
export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const cart = await prisma.cart.upsert({
    where: { customerId: session.id },
    update: {},
    create: { customerId: session.id },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, slug: true, price: true, mainImage: true, stock: true, weight: true, width: true, height: true, length: true } },
          variant: { select: { id: true, name: true, price: true, stock: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return NextResponse.json({ cart });
}

// POST — Adiciona item ao carrinho
export async function POST(request: Request) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { productId, variantId, quantity = 1 } = await request.json();
  if (!productId) return NextResponse.json({ error: "Produto obrigatório." }, { status: 400 });

  // Verifica estoque disponível
  let availableStock: number | null = null;
  let productName = "Produto";

  if (variantId) {
    const variant = await prisma.variant.findUnique({
      where: { id: variantId },
      select: { stock: true, active: true, name: true, product: { select: { name: true } } },
    });
    if (!variant || !variant.active) {
      return NextResponse.json({ error: "Variante não disponível." }, { status: 400 });
    }
    availableStock = variant.stock;
    productName = `${variant.product.name} (${variant.name})`;
  } else {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true, active: true, name: true },
    });
    if (!product || !product.active) {
      return NextResponse.json({ error: "Produto não disponível." }, { status: 400 });
    }
    availableStock = product.stock;
    productName = product.name;
  }

  const cart = await prisma.cart.upsert({
    where: { customerId: session.id },
    update: {},
    create: { customerId: session.id },
  });

  // Verifica se já tem esse item no carrinho
  const existing = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId, variantId: variantId || null },
  });

  const totalDesired = (existing?.quantity || 0) + quantity;

  // Bloqueio de estoque (null = sob encomenda, ilimitado)
  if (availableStock !== null && totalDesired > availableStock) {
    if (availableStock === 0) {
      return NextResponse.json({ error: `${productName} está esgotado.` }, { status: 400 });
    }
    return NextResponse.json({
      error: `Apenas ${availableStock} ${availableStock === 1 ? "unidade disponível" : "unidades disponíveis"} de ${productName}.`,
    }, { status: 400 });
  }

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: totalDesired },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, variantId: variantId || null, quantity },
    });
  }

  return NextResponse.json({ success: true });
}

// PUT — Atualiza quantidade
export async function PUT(request: Request) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { itemId, quantity } = await request.json();
  if (!itemId || quantity < 1) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  // Busca o item para validar estoque
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: {
      product: { select: { stock: true, name: true, active: true } },
      variant: { select: { stock: true, active: true, name: true } },
    },
  });

  if (!item) return NextResponse.json({ error: "Item não encontrado." }, { status: 404 });

  const stock = item.variant ? item.variant.stock : item.product.stock;
  const active = item.variant ? item.variant.active : item.product.active;
  const name = item.variant ? `${item.product.name} (${item.variant.name})` : item.product.name;

  if (!active) {
    return NextResponse.json({ error: `${name} não está mais disponível.` }, { status: 400 });
  }

  if (stock !== null && quantity > stock) {
    return NextResponse.json({
      error: `Apenas ${stock} ${stock === 1 ? "unidade disponível" : "unidades disponíveis"}.`,
    }, { status: 400 });
  }

  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  return NextResponse.json({ success: true });
}

// DELETE — Remove item do carrinho
export async function DELETE(request: Request) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { itemId } = await request.json();
  if (!itemId) return NextResponse.json({ error: "Item obrigatório." }, { status: 400 });

  await prisma.cartItem.delete({ where: { id: itemId } });
  return NextResponse.json({ success: true });
}

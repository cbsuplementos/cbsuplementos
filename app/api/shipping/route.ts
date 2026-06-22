import { NextResponse } from "next/server";
import { calcularFrete, consultarCep, OutsideDeliveryAreaError, PackageItem } from "@/lib/correios";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cep, items, subtotal } = body;

    if (!cep) {
      return NextResponse.json({ error: "CEP é obrigatório." }, { status: 400 });
    }

    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) {
      return NextResponse.json({ error: "CEP inválido. Digite os 8 números." }, { status: 400 });
    }

    // Montar array de pacotes — um por item do carrinho
    // (mantido por compatibilidade; o cálculo atual via motoboy não usa dimensão/peso)
    const packages: PackageItem[] = [];
    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        packages.push({
          weight: item.weight || 300,
          height: item.height || 10,
          width: item.width || 15,
          length: item.length || 20,
          quantity: item.quantity || 1,
        });
      }
    } else {
      packages.push({ weight: 300, height: 10, width: 15, length: 20, quantity: 1 });
    }

    const subtotalNum = typeof subtotal === "number" ? subtotal : 0;

    // Busca endereço (para preencher o formulário) em paralelo com o frete
    const [addressResult, freightResult] = await Promise.allSettled([
      consultarCep(cleanCep),
      calcularFrete(cleanCep, packages, subtotalNum),
    ]);

    const address =
      addressResult.status === "fulfilled"
        ? addressResult.value
        : { cep: cleanCep, street: "", neighborhood: "", city: "", state: "" };

    // CEP fora da área de entrega — bloqueia com mensagem clara, sem opções de frete
    if (freightResult.status === "rejected") {
      const err = freightResult.reason;
      if (err instanceof OutsideDeliveryAreaError) {
        return NextResponse.json(
          { error: err.message, outsideArea: true, address },
          { status: 422 }
        );
      }
      console.error("[SHIPPING_ERROR]", err);
      return NextResponse.json(
        { error: "Não foi possível calcular o frete para esse CEP. Tente novamente." },
        { status: 502 }
      );
    }

    return NextResponse.json({ address, options: freightResult.value });
  } catch (error) {
    console.error("[SHIPPING_ERROR]", error);
    return NextResponse.json(
      { error: "Erro ao consultar CEP. Tente novamente." },
      { status: 500 }
    );
  }
}

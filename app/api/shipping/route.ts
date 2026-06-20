import { NextResponse } from "next/server";
import { calcularFrete, consultarCep, PackageItem } from "@/lib/correios";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cep, items } = body;

    if (!cep) {
      return NextResponse.json({ error: "CEP é obrigatório." }, { status: 400 });
    }

    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) {
      return NextResponse.json({ error: "CEP inválido. Digite os 8 números." }, { status: 400 });
    }

    // Montar array de pacotes — um por item do carrinho
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
      // Fallback: pacote genérico
      packages.push({ weight: 300, height: 10, width: 15, length: 20, quantity: 1 });
    }

    // Busca endereço e frete em paralelo
    const [addressResult, freightOptions] = await Promise.allSettled([
      consultarCep(cleanCep),
      calcularFrete(cleanCep, packages),
    ]);

    const address =
      addressResult.status === "fulfilled"
        ? addressResult.value
        : { cep: cleanCep, street: "", neighborhood: "", city: "", state: "" };

    const options =
      freightOptions.status === "fulfilled"
        ? freightOptions.value
        : [
            { service: "PAC", name: "PAC — Econômico (estimado)", price: 25.9, deadline: "8 a 12 dias úteis", deadlineDays: 10 },
            { service: "SEDEX", name: "SEDEX — Expresso (estimado)", price: 45.9, deadline: "3 a 5 dias úteis", deadlineDays: 4 },
          ];

    return NextResponse.json({ address, options });
  } catch (error) {
    console.error("[SHIPPING_ERROR]", error);
    return NextResponse.json({
      address: { cep: "", street: "", neighborhood: "", city: "", state: "" },
      options: [
        { service: "PAC", name: "PAC — Econômico (estimado)", price: 25.9, deadline: "8 a 12 dias úteis", deadlineDays: 10 },
        { service: "SEDEX", name: "SEDEX — Expresso (estimado)", price: 45.9, deadline: "3 a 5 dias úteis", deadlineDays: 4 },
      ],
    });
  }
}

/**
 * correios.ts — Entrega via motoboy (área restrita)
 *
 * A CB Suplementos atende apenas dois municípios: Belém/PA e Petrolina/PE.
 * Não há mais cotação de frete nacional (Correios/Melhor Envio foi removido).
 *
 * Regra de negócio:
 *   - CEP fora da whitelist → área não atendida (bloqueia checkout).
 *   - CEP dentro da whitelist → frete fixo por cidade, ou grátis acima de
 *     um valor mínimo de subtotal (configurável por cidade).
 *
 * VALORES PROVISÓRIOS — ajustar `flatFee` e `freeShippingThreshold` em
 * CIDADES_ATENDIDAS conforme o cliente definir. Nada além deste arquivo
 * precisa ser tocado quando os valores chegarem.
 *
 * Nome do arquivo mantido como "correios.ts" para não quebrar imports
 * existentes — o conteúdo não tem mais relação com os Correios.
 */

export interface ShippingOption {
  service: string;
  name: string;
  price: number;
  deadline: string;
  deadlineDays: number;
}

export interface AddressInfo {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface PackageItem {
  weight: number; // gramas
  height: number; // cm
  width: number; // cm
  length: number; // cm
  quantity: number;
}

// =====================================================
// ÁREA DE ENTREGA — única fonte de verdade
// =====================================================

interface CidadeAtendida {
  /** Nome normalizado (sem acento, lowercase) para comparação. */
  nomeNormalizado: string;
  /** Nome de exibição. */
  nome: string;
  uf: string;
  /** Taxa fixa de entrega via motoboy, em reais. */
  flatFee: number;
  /** Subtotal mínimo (em reais) para frete grátis. `null` = nunca é grátis. */
  freeShippingThreshold: number | null;
  /** Prazo estimado de entrega exibido ao cliente. */
  deadline: string;
}

const CIDADES_ATENDIDAS: CidadeAtendida[] = [
  {
    nomeNormalizado: "belem",
    nome: "Belém",
    uf: "PA",
    flatFee: 0, // TODO: definir com o cliente (em reais, ex.: 15.00)
    freeShippingThreshold: null, // TODO: definir com o cliente (em reais, ex.: 150.00)
    deadline: "Entrega no mesmo dia ou próximo dia útil",
  },
  {
    nomeNormalizado: "petrolina",
    nome: "Petrolina",
    uf: "PE",
    flatFee: 0, // TODO: definir com o cliente
    freeShippingThreshold: null, // TODO: definir com o cliente
    deadline: "Entrega no mesmo dia ou próximo dia útil",
  },
];

function normalizarNomeCidade(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function buscarCidadeAtendida(cidade: string, uf: string): CidadeAtendida | null {
  const cidadeNormalizada = normalizarNomeCidade(cidade);
  const ufNormalizada = uf.toUpperCase().trim();

  return (
    CIDADES_ATENDIDAS.find(
      (c) => c.nomeNormalizado === cidadeNormalizada && c.uf === ufNormalizada
    ) ?? null
  );
}

/** Erro específico para CEP fora da área de entrega — permite tratamento diferenciado no caller. */
export class OutsideDeliveryAreaError extends Error {
  constructor(public city: string, public state: string) {
    super(
      `Ainda não entregamos em ${city}/${state}. Atendemos apenas Belém (PA) e Petrolina (PE).`
    );
    this.name = "OutsideDeliveryAreaError";
  }
}

// =====================================================
// CONSULTA DE CEP — ViaCEP (mantido)
// =====================================================

/**
 * Consulta CEP via ViaCEP (gratuito, sem autenticação)
 */
export async function consultarCep(cep: string): Promise<AddressInfo> {
  const cleanCep = cep.replace(/\D/g, "");

  if (cleanCep.length !== 8) {
    throw new Error("CEP inválido");
  }

  const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) {
    throw new Error("Erro ao consultar CEP");
  }

  const data = await res.json();

  if (data.erro) {
    throw new Error("CEP não encontrado");
  }

  return {
    cep: data.cep,
    street: data.logradouro || "",
    neighborhood: data.bairro || "",
    city: data.localidade || "",
    state: data.uf || "",
  };
}

// =====================================================
// CÁLCULO DE FRETE — motoboy, área restrita
// =====================================================

/**
 * Calcula o frete via motoboy para um CEP de destino.
 *
 * Lança `OutsideDeliveryAreaError` se o CEP não estiver em Belém/PA ou
 * Petrolina/PE — o caller (route handler) deve tratar esse erro e
 * retornar uma resposta clara ao front, bloqueando o checkout.
 *
 * `packages` é aceito por compatibilidade com o caller atual, mas não é
 * usado no cálculo (tarifa fixa não depende de dimensão/peso). Mantido
 * caso a estratégia mude para um serviço terceirizado com cálculo por
 * distância/peso no futuro.
 */
export async function calcularFrete(
  cepDestino: string,
  packages: PackageItem[],
  subtotal: number = 0
): Promise<ShippingOption[]> {
  const cleanCep = cepDestino.replace(/\D/g, "");
  const address = await consultarCep(cleanCep);

  const cidade = buscarCidadeAtendida(address.city, address.state);
  if (!cidade) {
    throw new OutsideDeliveryAreaError(address.city, address.state);
  }

  const isFree =
    cidade.freeShippingThreshold !== null && subtotal >= cidade.freeShippingThreshold;

  const option: ShippingOption = {
    service: "MOTOBOY",
    name: isFree ? `Entrega via motoboy — ${cidade.nome}` : `Entrega via motoboy — ${cidade.nome}`,
    price: isFree ? 0 : cidade.flatFee,
    deadline: cidade.deadline,
    deadlineDays: 1,
  };

  return [option];
}

/**
 * Apenas valida se um CEP está na área de entrega, sem calcular preço.
 * Útil para revalidação no servidor antes de criar o pedido.
 */
export async function validarAreaEntrega(
  cep: string
): Promise<{ ok: true; address: AddressInfo } | { ok: false; message: string }> {
  try {
    const address = await consultarCep(cep);
    const cidade = buscarCidadeAtendida(address.city, address.state);
    if (!cidade) {
      return {
        ok: false,
        message: `Ainda não entregamos em ${address.city}/${address.state}. Atendemos apenas Belém (PA) e Petrolina (PE).`,
      };
    }
    return { ok: true, address };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao consultar CEP";
    return { ok: false, message: msg };
  }
}

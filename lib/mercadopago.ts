/**
 * mercadopago.ts — Integração com a API de Orders do Mercado Pago
 */

import { randomUUID } from "crypto";

const MP_BASE_URL = "https://api.mercadopago.com";
const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || "";

interface OrderItem {
  title: string;
  quantity: number;
  unitPrice: number;
  pictureUrl?: string;
}

interface PixPaymentData {
  type: "pix";
  externalReference: string;
  items: OrderItem[];
  totalAmount: number;
  payerEmail: string;
  notificationUrl: string;
}

interface CardPaymentData {
  type: "credit_card";
  externalReference: string;
  items: OrderItem[];
  totalAmount: number;
  token: string;
  installments: number;
  payerEmail: string;
  notificationUrl: string;
}

export interface MpOrderResponse {
  id: string;
  status: string;
  status_detail: string;
  external_reference: string;
  transactions?: {
    payments?: Array<{
      id: string;
      status: string;
      status_detail: string;
      payment_method?: { id: string; type: string };
      amount: string;
      point_of_interaction?: {
        transaction_data?: {
          qr_code?: string;
          qr_code_base64?: string;
          ticket_url?: string;
        };
      };
    }>;
  };
}

function headers() {
  return {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    "Content-Type": "application/json",
    "X-Idempotency-Key": randomUUID(),
  };
}

export async function createPixOrder(data: PixPaymentData): Promise<MpOrderResponse> {
  if (!ACCESS_TOKEN) {
    throw new Error("MP_ACCESS_TOKEN não configurado nas variáveis de ambiente.");
  }

  const body = {
    type: "online",
    processing_mode: "automatic",
    total_amount: data.totalAmount.toFixed(2),
    external_reference: data.externalReference,
    payer: { email: data.payerEmail },
    transactions: {
      payments: [
        {
          amount: data.totalAmount.toFixed(2),
          payment_method: { id: "pix", type: "bank_transfer" },
        },
      ],
    },
  };

  console.log("[MP_PIX] Request body:", JSON.stringify(body));

  const res = await fetch(`${MP_BASE_URL}/v1/orders`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  const responseText = await res.text();
  console.log("[MP_PIX] Response status:", res.status);
  console.log("[MP_PIX] Response body FULL:", responseText);

  if (!res.ok) {
    throw new Error(`Mercado Pago erro ${res.status}: ${responseText.substring(0, 200)}`);
  }

  const parsed = JSON.parse(responseText);
  console.log("[MP_PIX] Transactions:", JSON.stringify(parsed.transactions || {}, null, 2));

  return parsed;
}

export async function createCardOrder(data: CardPaymentData): Promise<MpOrderResponse> {
  if (!ACCESS_TOKEN) {
    throw new Error("MP_ACCESS_TOKEN não configurado nas variáveis de ambiente.");
  }

  const body = {
    type: "online",
    processing_mode: "automatic",
    total_amount: data.totalAmount.toFixed(2),
    external_reference: data.externalReference,
    payer: { email: data.payerEmail },
    transactions: {
      payments: [
        {
          amount: data.totalAmount.toFixed(2),
          payment_method: {
            id: "master",
            type: "credit_card",
            token: data.token,
            installments: data.installments,
          },
        },
      ],
    },
  };

  const res = await fetch(`${MP_BASE_URL}/v1/orders`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  const responseText = await res.text();
  console.log("[MP_CARD] Response status:", res.status);

  if (!res.ok) {
    throw new Error(`Mercado Pago erro ${res.status}: ${responseText.substring(0, 200)}`);
  }

  return JSON.parse(responseText);
}

export async function getOrder(orderId: string): Promise<MpOrderResponse> {
  const res = await fetch(`${MP_BASE_URL}/v1/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to get order: ${res.status}`);
  }

  return res.json();
}

export function getPublicKey(): string {
  return process.env.MP_PUBLIC_KEY || "";
}

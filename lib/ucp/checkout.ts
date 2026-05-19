/**
 * UCP Checkout tools — create/get/update/complete/cancel.
 *
 * Estrategia: TODOS los checkouts retornan status `requires_escalation`
 * con un `continue_url` que apunta a la página /obra/[slug] de maarmapa-web.
 * Razón: maarmapa soporta 3 métodos de pago (MP, Khipu, x402), la selección
 * la hace el comprador en nuestra UI — el agente no procesa pagos.
 *
 * Esto es 100% compatible con UCP — el spec contempla exactamente este caso.
 *
 * Schema Supabase (tabla `maarmapa_ucp_checkouts`):
 *   create table if not exists maarmapa_ucp_checkouts (
 *     id uuid primary key default gen_random_uuid(),
 *     access_key text not null default substring(md5(random()::text), 1, 16),
 *     cart_id uuid references maarmapa_ucp_carts(id),
 *     status text not null default 'incomplete'
 *       check (status in ('incomplete','requires_escalation','ready_for_complete','completed','canceled')),
 *     line_items jsonb not null,
 *     buyer jsonb,
 *     fulfillment jsonb,
 *     payment jsonb,
 *     subtotal_clp integer not null,
 *     total_clp integer not null,
 *     created_at timestamptz default now(),
 *     completed_at timestamptz
 *   );
 */

import { supabase } from "@/lib/supabase";
import { artworks } from "@/lib/artworks";
import { getCart } from "./cart";
import {
  UCP_SHOP_GID_PREFIX,
  type UcpCheckout,
  type UcpLineItem,
} from "./types";

const CURRENCY = "CLP";
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://maarmapa.eth.limo";

function priceItems(items: UcpLineItem[]) {
  let subtotal = 0;
  for (const item of items) {
    const m = item.variant_id.match(/ArtworkVariant\/([\w-]+)/) || item.variant_id.match(/Artwork\/([\w-]+)/);
    const slug = m?.[1];
    const art = slug ? artworks.find((a) => a.slug === slug) : undefined;
    if (art) subtotal += art.priceClp * item.quantity;
  }
  return subtotal;
}

function makeCheckoutGid(id: string, key: string) {
  return `${UCP_SHOP_GID_PREFIX}/Checkout/${id}?key=${key}`;
}

function makeContinueUrl(items: UcpLineItem[], checkoutId: string): string {
  // Si hay 1 sola obra, link directo a su página
  if (items.length === 1) {
    const m =
      items[0].variant_id.match(/ArtworkVariant\/([\w-]+)/) ||
      items[0].variant_id.match(/Artwork\/([\w-]+)/);
    const slug = m?.[1];
    if (slug) {
      return `${BASE_URL}/obra/${slug}?checkout=${checkoutId}`;
    }
  }
  return `${BASE_URL}/checkout/escalated?id=${checkoutId}`;
}

function parseCheckoutId(gidOrUuid: string): { id: string; key?: string } {
  // gid://maarmapa/Checkout/<uuid>?key=<key>
  const m = gidOrUuid.match(/Checkout\/([\w-]+)(?:\?key=(\w+))?/);
  if (m) return { id: m[1], key: m[2] };
  return { id: gidOrUuid };
}

export async function createCheckout(args: {
  cart_id?: string;
  checkout?: {
    line_items?: UcpLineItem[];
    buyer?: UcpCheckout["buyer"];
    fulfillment?: UcpCheckout["fulfillment"];
    currency?: string;
  };
}): Promise<UcpCheckout> {
  let lineItems: UcpLineItem[] = args.checkout?.line_items ?? [];
  let buyer = args.checkout?.buyer;
  let cartUuid: string | null = null;

  if (args.cart_id) {
    const cart = await getCart(args.cart_id);
    lineItems = cart.line_items;
    buyer = cart.buyer ?? buyer;
    cartUuid = cart.id.split("/").pop() ?? null;
  }

  const subtotal = priceItems(lineItems);

  const sb = supabase();
  const { data, error } = await sb
    .from("maarmapa_ucp_checkouts")
    .insert({
      cart_id: cartUuid,
      status: "requires_escalation",
      line_items: lineItems,
      buyer: buyer ?? null,
      fulfillment: args.checkout?.fulfillment ?? null,
      subtotal_clp: subtotal,
      total_clp: subtotal,
    })
    .select("id, access_key")
    .single();
  if (error) throw new Error(`checkout_create_failed: ${error.message}`);

  const continueUrl = makeContinueUrl(lineItems, data.id);

  return {
    id: makeCheckoutGid(data.id, data.access_key),
    status: "requires_escalation",
    cart_id: args.cart_id,
    currency: CURRENCY,
    line_items: lineItems,
    buyer,
    totals: {
      subtotal: { amount: subtotal, currency: CURRENCY },
      total: { amount: subtotal, currency: CURRENCY },
    },
    continue_url: continueUrl,
    messages: [
      {
        type: "info",
        severity: "requires_buyer_review",
        text: "maarmapa supports 3 payment methods (Mercado Pago, Khipu, USDC/x402). The buyer must select one on the storefront. Use continue_url to send them.",
      },
    ],
  };
}

export async function getCheckout(idGid: string): Promise<UcpCheckout> {
  const { id } = parseCheckoutId(idGid);
  const sb = supabase();
  const { data, error } = await sb
    .from("maarmapa_ucp_checkouts")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) throw new Error("checkout_not_found");

  return {
    id: makeCheckoutGid(data.id, data.access_key),
    status: data.status,
    cart_id: data.cart_id
      ? `${UCP_SHOP_GID_PREFIX}/Cart/${data.cart_id}`
      : undefined,
    currency: CURRENCY,
    line_items: data.line_items,
    buyer: data.buyer ?? undefined,
    fulfillment: data.fulfillment ?? undefined,
    payment: data.payment ?? undefined,
    totals: {
      subtotal: { amount: data.subtotal_clp, currency: CURRENCY },
      total: { amount: data.total_clp, currency: CURRENCY },
    },
    continue_url: makeContinueUrl(data.line_items, data.id),
    messages: [],
  };
}

export async function updateCheckout(args: {
  id: string;
  checkout?: Record<string, unknown>;
}): Promise<UcpCheckout> {
  const { id } = parseCheckoutId(args.id);
  const sb = supabase();
  const patch: Record<string, unknown> = {};
  const c = args.checkout ?? {};
  if (c.buyer !== undefined) patch.buyer = c.buyer;
  if (c.fulfillment !== undefined) patch.fulfillment = c.fulfillment;
  if (c.payment !== undefined) patch.payment = c.payment;

  if (Object.keys(patch).length > 0) {
    const { error } = await sb
      .from("maarmapa_ucp_checkouts")
      .update(patch)
      .eq("id", id);
    if (error) throw new Error(`checkout_update_failed: ${error.message}`);
  }
  return getCheckout(args.id);
}

export async function completeCheckout(args: {
  id: string;
}): Promise<UcpCheckout> {
  // En nuestra implementación, completar siempre requiere escalación al
  // storefront porque el comprador elige método (MP/Khipu/x402).
  // Retornamos `requires_escalation` con continue_url.
  return getCheckout(args.id);
}

export async function cancelCheckout(idGid: string): Promise<UcpCheckout> {
  const { id } = parseCheckoutId(idGid);
  const sb = supabase();
  await sb
    .from("maarmapa_ucp_checkouts")
    .update({ status: "canceled" })
    .eq("id", id);
  return getCheckout(idGid);
}

// ─── MCP tool schemas ──────────────────────────────────────────
export const checkoutTools = [
  {
    name: "create_checkout",
    description:
      "Initiate a checkout session for maarmapa. Note: maarmapa supports multiple payment methods (Mercado Pago for Chile, Khipu for bank transfer, USDC/x402 for crypto), so checkouts always return status='requires_escalation' with continue_url pointing to the storefront where the buyer selects payment method.",
    inputSchema: {
      type: "object",
      properties: {
        cart_id: { type: "string" },
        checkout: {
          type: "object",
          properties: {
            line_items: { type: "array" },
            buyer: { type: "object" },
            fulfillment: { type: "object" },
            currency: { type: "string" },
          },
        },
      },
    },
  },
  {
    name: "get_checkout",
    description: "Retrieve checkout session state.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
  {
    name: "update_checkout",
    description: "Modify buyer info, fulfillment, or payment fields.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        checkout: { type: "object" },
      },
      required: ["id"],
    },
  },
  {
    name: "complete_checkout",
    description:
      "Submit checkout for completion. In this implementation always returns 'requires_escalation' — buyer must visit continue_url to choose payment method.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
  {
    name: "cancel_checkout",
    description: "Cancel an active checkout session.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
] as const;

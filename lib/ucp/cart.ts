/**
 * UCP Cart tools — create_cart, get_cart, update_cart, cancel_cart
 *
 * Estado guardado en Supabase tabla `maarmapa_ucp_carts`.
 * Schema:
 *   create table if not exists maarmapa_ucp_carts (
 *     id uuid primary key default gen_random_uuid(),
 *     line_items jsonb not null,
 *     buyer jsonb,
 *     context jsonb,
 *     subtotal_clp integer not null,
 *     total_clp integer not null,
 *     status text not null default 'active' check (status in ('active','canceled','converted','expired')),
 *     created_at timestamptz default now(),
 *     expires_at timestamptz default (now() + interval '7 days')
 *   );
 */

import { supabase } from "@/lib/supabase";
import { artworks } from "@/lib/artworks";
import {
  UCP_SHOP_GID_PREFIX,
  type UcpCart,
  type UcpLineItem,
  type UcpBuyer,
  type UcpCartContext,
} from "./types";

const CURRENCY = "CLP";
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://maarmapa.eth.limo";

function slugFromVariantGid(gid: string): string | null {
  const m = gid.match(/ArtworkVariant\/([\w-]+)$/) || gid.match(/Artwork\/([\w-]+)$/);
  return m ? m[1] : null;
}

function priceCartItems(items: UcpLineItem[]) {
  let subtotal = 0;
  const validated: UcpLineItem[] = [];
  const messages: UcpCart["messages"] = [];

  for (const item of items) {
    const slug = slugFromVariantGid(item.variant_id);
    const art = slug ? artworks.find((a) => a.slug === slug) : undefined;
    if (!art) {
      messages.push({
        type: "error",
        severity: "warning",
        text: `variant not found: ${item.variant_id}`,
      });
      continue;
    }
    if (art.status !== "available") {
      messages.push({
        type: "error",
        severity: "warning",
        text: `${art.title} is not available (status: ${art.status})`,
      });
      continue;
    }
    // Cada obra es única → limitar a 1
    const qty = Math.min(item.quantity, 1);
    validated.push({ variant_id: item.variant_id, quantity: qty });
    subtotal += art.priceClp * qty;
  }

  return { validated, subtotal, messages };
}

export async function createCart(args: {
  line_items: UcpLineItem[];
  buyer?: UcpBuyer;
  context?: UcpCartContext;
}): Promise<UcpCart> {
  const { validated, subtotal, messages } = priceCartItems(args.line_items);

  const sb = supabase();
  const { data, error } = await sb
    .from("maarmapa_ucp_carts")
    .insert({
      line_items: validated,
      buyer: args.buyer ?? null,
      context: args.context ?? null,
      subtotal_clp: subtotal,
      total_clp: subtotal,
    })
    .select("id, expires_at")
    .single();
  if (error) throw new Error(`cart_create_failed: ${error.message}`);

  return {
    id: `${UCP_SHOP_GID_PREFIX}/Cart/${data.id}`,
    currency: CURRENCY,
    line_items: validated,
    totals: {
      subtotal: { amount: subtotal, currency: CURRENCY },
      total: { amount: subtotal, currency: CURRENCY },
    },
    continue_url: `${BASE_URL}/cart/${data.id}`,
    expires_at: data.expires_at,
    messages,
    buyer: args.buyer,
    context: args.context,
  };
}

function extractUuid(gidOrUuid: string): string {
  const m = gidOrUuid.match(/Cart\/([\w-]+)/);
  return m ? m[1] : gidOrUuid;
}

export async function getCart(id: string): Promise<UcpCart> {
  const uuid = extractUuid(id);
  const sb = supabase();
  const { data, error } = await sb
    .from("maarmapa_ucp_carts")
    .select("*")
    .eq("id", uuid)
    .single();
  if (error || !data) throw new Error("cart_not_found");

  return {
    id: `${UCP_SHOP_GID_PREFIX}/Cart/${data.id}`,
    currency: CURRENCY,
    line_items: data.line_items,
    totals: {
      subtotal: { amount: data.subtotal_clp, currency: CURRENCY },
      total: { amount: data.total_clp, currency: CURRENCY },
    },
    continue_url: `${BASE_URL}/cart/${data.id}`,
    expires_at: data.expires_at,
    messages: [],
    buyer: data.buyer ?? undefined,
    context: data.context ?? undefined,
  };
}

export async function updateCart(args: {
  id: string;
  line_items?: UcpLineItem[];
  buyer?: UcpBuyer;
  context?: UcpCartContext;
}): Promise<UcpCart> {
  const uuid = extractUuid(args.id);
  const sb = supabase();

  const patch: Record<string, unknown> = {};
  let subtotal: number | undefined;
  let messages: UcpCart["messages"] = [];

  if (args.line_items) {
    const result = priceCartItems(args.line_items);
    patch.line_items = result.validated;
    patch.subtotal_clp = result.subtotal;
    patch.total_clp = result.subtotal;
    subtotal = result.subtotal;
    messages = result.messages;
  }
  if (args.buyer !== undefined) patch.buyer = args.buyer;
  if (args.context !== undefined) patch.context = args.context;

  const { data, error } = await sb
    .from("maarmapa_ucp_carts")
    .update(patch)
    .eq("id", uuid)
    .select("*")
    .single();
  if (error || !data) throw new Error(`cart_update_failed: ${error?.message}`);

  return {
    id: `${UCP_SHOP_GID_PREFIX}/Cart/${data.id}`,
    currency: CURRENCY,
    line_items: data.line_items,
    totals: {
      subtotal: { amount: data.subtotal_clp, currency: CURRENCY },
      total: { amount: data.total_clp, currency: CURRENCY },
    },
    continue_url: `${BASE_URL}/cart/${data.id}`,
    expires_at: data.expires_at,
    messages,
    buyer: data.buyer ?? undefined,
    context: data.context ?? undefined,
  };
}

export async function cancelCart(id: string): Promise<{ id: string; status: string }> {
  const uuid = extractUuid(id);
  const sb = supabase();
  const { error } = await sb
    .from("maarmapa_ucp_carts")
    .update({ status: "canceled" })
    .eq("id", uuid);
  if (error) throw new Error(`cart_cancel_failed: ${error.message}`);
  return { id: `${UCP_SHOP_GID_PREFIX}/Cart/${uuid}`, status: "canceled" };
}

// ─── MCP tool schemas ──────────────────────────────────────────
export const cartTools = [
  {
    name: "create_cart",
    description:
      "Create a new cart for maarmapa artworks. Returns cart ID and continue_url for the buyer to complete purchase.",
    inputSchema: {
      type: "object",
      properties: {
        line_items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              variant_id: { type: "string" },
              quantity: { type: "integer", minimum: 1 },
            },
            required: ["variant_id", "quantity"],
          },
        },
        buyer: {
          type: "object",
          properties: {
            email: { type: "string" },
            first_name: { type: "string" },
            last_name: { type: "string" },
          },
        },
        context: {
          type: "object",
          properties: {
            address_country: { type: "string" },
            address_region: { type: "string" },
          },
        },
      },
      required: ["line_items"],
    },
  },
  {
    name: "get_cart",
    description: "Retrieve current cart state by cart ID.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
  {
    name: "update_cart",
    description:
      "Replace cart contents. Omitted fields keep existing values (PATCH semantics for this implementation).",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        line_items: { type: "array", items: { type: "object" } },
        buyer: { type: "object" },
        context: { type: "object" },
      },
      required: ["id"],
    },
  },
  {
    name: "cancel_cart",
    description: "Cancel and remove a cart.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
] as const;

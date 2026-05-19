/**
 * UCP Order tools — get_order
 *
 * Lee de la tabla maarmapa_orders (que ya usamos para MP/Khipu/x402).
 */

import { supabase } from "@/lib/supabase";
import {
  UCP_SHOP_GID_PREFIX,
  type UcpOrder,
  type UcpOrderStatus,
} from "./types";

const CURRENCY = "CLP";

function mapStatus(status: string): UcpOrderStatus {
  switch (status) {
    case "paid":
      return "paid";
    case "cancelled":
    case "expired":
      return "cancelled";
    case "pending":
    default:
      return "pending";
  }
}

export async function getOrder(idOrShortId: string): Promise<UcpOrder> {
  // Aceptar gid o short_id directo
  const m = idOrShortId.match(/Order\/([\w-]+)/);
  const shortId = m ? m[1] : idOrShortId;

  const sb = supabase();
  const { data, error } = await sb
    .from("maarmapa_orders")
    .select("*")
    .eq("short_id", shortId)
    .single();
  if (error || !data) throw new Error("order_not_found");

  return {
    id: `${UCP_SHOP_GID_PREFIX}/Order/${data.short_id}`,
    status: mapStatus(data.status),
    currency: CURRENCY,
    line_items: [
      {
        variant_id: `${UCP_SHOP_GID_PREFIX}/ArtworkVariant/${data.artwork_slug}`,
        quantity: 1,
      },
    ],
    totals: {
      subtotal: { amount: data.price_clp, currency: CURRENCY },
      total: { amount: data.price_clp, currency: CURRENCY },
    },
    buyer: data.buyer_email
      ? {
          email: data.buyer_email,
          first_name: data.buyer_name?.split(" ")[0],
          last_name: data.buyer_name?.split(" ").slice(1).join(" "),
        }
      : undefined,
    created_at: data.created_at,
    paid_at: data.paid_at ?? undefined,
  };
}

export const orderTools = [
  {
    name: "get_order",
    description:
      "Get status and details of a maarmapa order by short_id or GID.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Order GID or short_id (e.g. 'a1b2c3d4')",
        },
      },
      required: ["id"],
    },
  },
] as const;

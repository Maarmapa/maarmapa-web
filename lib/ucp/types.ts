/**
 * UCP (Universal Commerce Protocol) types
 * Spec version: 2026-04-08
 * Reference: https://shopify.dev/docs/agents
 *
 * Implementación independiente — no requiere Shopify.
 * Endpoint: POST /api/ucp/mcp (JSON-RPC 2.0)
 */

export const UCP_VERSION = "2026-04-08";
export const UCP_SHOP_GID_PREFIX = "gid://maarmapa";

// ─── JSON-RPC envelope ─────────────────────────────────────────
export type JsonRpcRequest = {
  jsonrpc: "2.0";
  id: string | number | null;
  method: string;
  params?: {
    name?: string;
    arguments?: Record<string, unknown>;
    meta?: UcpMeta;
  } & Record<string, unknown>;
};

export type JsonRpcResponse =
  | {
      jsonrpc: "2.0";
      id: string | number | null;
      result: unknown;
    }
  | {
      jsonrpc: "2.0";
      id: string | number | null;
      error: { code: number; message: string; data?: unknown };
    };

export type UcpMeta = {
  "ucp-agent"?: {
    profile?: string;
  };
  "idempotency-key"?: string;
};

// ─── MCP tool definition ───────────────────────────────────────
export type McpTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

// ─── Catalog ───────────────────────────────────────────────────
export type UcpProductMedia = {
  type: "image" | "video";
  url: string;
  alt_text?: string;
};

export type UcpProductOption = {
  name: string;
  values: string[];
};

export type UcpProductVariant = {
  id: string;
  sku?: string | null;
  title: string;
  price: { amount: number; currency: string }; // amount in minor units (1899 = $18.99)
  available: boolean;
  options?: Record<string, string>;
};

export type UcpProduct = {
  id: string; // gid://maarmapa/Artwork/<slug>
  handle: string;
  title: string;
  description: { html?: string; plain: string };
  url: string;
  categories: string[];
  price_range: {
    min: { amount: number; currency: string };
    max: { amount: number; currency: string };
  };
  media: UcpProductMedia[];
  options: UcpProductOption[];
  variants: UcpProductVariant[];
  rating?: {
    value: number;
    scale_max: number;
    review_count: number;
  };
  metadata?: Record<string, unknown>;
};

// ─── Cart ──────────────────────────────────────────────────────
export type UcpLineItem = {
  variant_id: string;
  quantity: number;
};

export type UcpCartContext = {
  address_country?: string;
  address_region?: string;
  postal_code?: string;
};

export type UcpBuyer = {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
};

export type UcpCart = {
  id: string; // gid://maarmapa/Cart/<uuid>
  currency: string;
  line_items: UcpLineItem[];
  totals: {
    subtotal: { amount: number; currency: string };
    total: { amount: number; currency: string };
  };
  continue_url: string;
  expires_at: string;
  messages: Array<{ type: string; text: string; severity?: string }>;
  buyer?: UcpBuyer;
  context?: UcpCartContext;
};

// ─── Checkout ──────────────────────────────────────────────────
export type UcpCheckoutStatus =
  | "incomplete"
  | "requires_escalation"
  | "ready_for_complete"
  | "completed"
  | "canceled";

export type UcpCheckout = {
  id: string; // gid://maarmapa/Checkout/<uuid>?key=<random>
  status: UcpCheckoutStatus;
  cart_id?: string;
  currency: string;
  line_items: UcpLineItem[];
  buyer?: UcpBuyer;
  fulfillment?: {
    destination?: UcpCartContext & { address_line1?: string; city?: string };
    methods?: Array<{ id: string; title: string; price: number }>;
  };
  payment?: {
    instruments?: Array<{ id: string; handler_id: string; type: string }>;
  };
  totals: {
    subtotal: { amount: number; currency: string };
    shipping?: { amount: number; currency: string };
    tax?: { amount: number; currency: string };
    total: { amount: number; currency: string };
  };
  continue_url: string;
  messages: Array<{ type: string; severity?: string; text?: string }>;
};

// ─── Order ─────────────────────────────────────────────────────
export type UcpOrderStatus =
  | "pending"
  | "paid"
  | "fulfilled"
  | "cancelled"
  | "refunded";

export type UcpOrder = {
  id: string; // gid://maarmapa/Order/<short_id>
  status: UcpOrderStatus;
  currency: string;
  line_items: UcpLineItem[];
  totals: {
    subtotal: { amount: number; currency: string };
    total: { amount: number; currency: string };
  };
  buyer?: UcpBuyer;
  created_at: string;
  paid_at?: string;
};

// ─── Structured content envelope ───────────────────────────────
export type StructuredContent<T> = {
  structuredContent: T;
};

/**
 * UCP Endpoint — JSON-RPC 2.0 / MCP server
 *
 * POST /api/ucp/mcp
 *
 * Implementa el spec UCP de Shopify (versión 2026-04-08) de forma
 * independiente — sin requerir Shopify. Compatible con cualquier agente
 * UCP-compliant.
 *
 * Métodos soportados:
 *  - tools/list             (descubrir herramientas disponibles)
 *  - tools/call             (invocar una herramienta)
 *  - server/info            (metadata del servidor)
 *  - initialize             (handshake MCP estándar)
 */

import { NextResponse } from "next/server";
import {
  UCP_VERSION,
  type JsonRpcRequest,
  type JsonRpcResponse,
  type StructuredContent,
} from "@/lib/ucp/types";
import {
  catalogTools,
  searchCatalog,
  lookupCatalog,
  getProductDetail,
} from "@/lib/ucp/catalog";
import {
  cartTools,
  createCart,
  getCart,
  updateCart,
  cancelCart,
} from "@/lib/ucp/cart";
import {
  checkoutTools,
  createCheckout,
  getCheckout,
  updateCheckout,
  completeCheckout,
  cancelCheckout,
} from "@/lib/ucp/checkout";
import { orderTools, getOrder } from "@/lib/ucp/order";

export const runtime = "nodejs";

const ALL_TOOLS = [
  ...catalogTools,
  ...cartTools,
  ...checkoutTools,
  ...orderTools,
];

const SERVER_INFO = {
  name: "maarmapa-ucp",
  version: "1.0.0",
  protocol: "ucp",
  protocolVersion: UCP_VERSION,
  capabilities: {
    tools: true,
    catalog: true,
    cart: true,
    checkout: true,
    orders: true,
  },
  shop: {
    name: "maarmapa",
    domain: "maarmapa.eth.limo",
    ens: "maarmapa.eth",
    currency: "CLP",
    country: "CL",
    description:
      "Original oil paintings by Chilean contemporary artist maarmapa.",
    payment_methods: [
      { id: "mercadopago", label: "Mercado Pago (CL)", regions: ["CL"] },
      { id: "khipu", label: "Khipu bank transfer (CL)", regions: ["CL"] },
      { id: "x402", label: "USDC on Base (international)", regions: ["*"] },
    ],
  },
};

function ok(id: JsonRpcRequest["id"], result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

function err(
  id: JsonRpcRequest["id"],
  code: number,
  message: string,
  data?: unknown
): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message, data } };
}

function content<T>(data: T): StructuredContent<T> {
  return { structuredContent: data };
}

async function dispatchToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  switch (name) {
    // ── Catalog ────────────────────────────────────────────────
    case "search_catalog": {
      const query = String(args.query ?? "");
      const limit = Number(args.limit ?? 10);
      const products = searchCatalog(query, limit);
      return content({ products, total: products.length });
    }
    case "lookup_catalog": {
      const ids = (args.ids as string[]) ?? [];
      const products = lookupCatalog(ids);
      return content({ products });
    }
    case "get_product": {
      const id = String(args.id ?? "");
      const product = getProductDetail(id);
      if (!product) throw new Error(`product_not_found: ${id}`);
      return content({ product });
    }

    // ── Cart ───────────────────────────────────────────────────
    case "create_cart": {
      const cart = await createCart({
        line_items: (args.line_items as []) ?? [],
        buyer: args.buyer as Parameters<typeof createCart>[0]["buyer"],
        context: args.context as Parameters<typeof createCart>[0]["context"],
      });
      return content({ cart });
    }
    case "get_cart": {
      const cart = await getCart(String(args.id));
      return content({ cart });
    }
    case "update_cart": {
      const cart = await updateCart({
        id: String(args.id),
        line_items: args.line_items as never,
        buyer: args.buyer as never,
        context: args.context as never,
      });
      return content({ cart });
    }
    case "cancel_cart": {
      const result = await cancelCart(String(args.id));
      return content(result);
    }

    // ── Checkout ───────────────────────────────────────────────
    case "create_checkout": {
      const checkout = await createCheckout({
        cart_id: args.cart_id as string | undefined,
        checkout: args.checkout as Parameters<
          typeof createCheckout
        >[0]["checkout"],
      });
      return content({ checkout });
    }
    case "get_checkout": {
      const checkout = await getCheckout(String(args.id));
      return content({ checkout });
    }
    case "update_checkout": {
      const checkout = await updateCheckout({
        id: String(args.id),
        checkout: args.checkout as Record<string, unknown>,
      });
      return content({ checkout });
    }
    case "complete_checkout": {
      const checkout = await completeCheckout({ id: String(args.id) });
      return content({ checkout });
    }
    case "cancel_checkout": {
      const checkout = await cancelCheckout(String(args.id));
      return content({ checkout });
    }

    // ── Orders ─────────────────────────────────────────────────
    case "get_order": {
      const order = await getOrder(String(args.id));
      return content({ order });
    }

    default:
      throw new Error(`unknown_tool: ${name}`);
  }
}

export async function POST(req: Request): Promise<NextResponse<JsonRpcResponse>> {
  let body: JsonRpcRequest;
  try {
    body = (await req.json()) as JsonRpcRequest;
  } catch {
    return NextResponse.json(err(null, -32700, "Parse error: invalid JSON"));
  }

  if (body.jsonrpc !== "2.0") {
    return NextResponse.json(
      err(body.id ?? null, -32600, "Invalid Request: jsonrpc must be '2.0'")
    );
  }

  const method = body.method;
  const id = body.id ?? null;

  try {
    switch (method) {
      case "initialize":
        return NextResponse.json(
          ok(id, {
            protocolVersion: UCP_VERSION,
            serverInfo: SERVER_INFO,
            capabilities: SERVER_INFO.capabilities,
          })
        );

      case "server/info":
        return NextResponse.json(ok(id, SERVER_INFO));

      case "tools/list":
        return NextResponse.json(ok(id, { tools: ALL_TOOLS }));

      case "tools/call": {
        const name = body.params?.name;
        const args = body.params?.arguments ?? {};
        if (!name) {
          return NextResponse.json(
            err(id, -32602, "Invalid params: missing 'name'")
          );
        }
        const result = await dispatchToolCall(
          name,
          args as Record<string, unknown>
        );
        return NextResponse.json(ok(id, result));
      }

      default:
        return NextResponse.json(
          err(id, -32601, `Method not found: ${method}`)
        );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "internal_error";
    return NextResponse.json(err(id, -32000, msg));
  }
}

// GET para discovery / health-check de servidor MCP
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    ...SERVER_INFO,
    protocol: "ucp",
    methods: ["POST /api/ucp/mcp"],
    tools_count: ALL_TOOLS.length,
    docs: "https://github.com/Maarmapa/maarmapa-web#ucp",
  });
}

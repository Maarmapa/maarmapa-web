/**
 * UCP Server Discovery — accesible vía /.well-known/ucp.json (rewrite en next.config)
 */

import { NextResponse } from "next/server";
import { UCP_VERSION } from "@/lib/ucp/types";

export const runtime = "nodejs";

export async function GET() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://maarmapa.eth.limo";

  return NextResponse.json({
    protocol: "ucp",
    version: UCP_VERSION,
    server: {
      name: "maarmapa-ucp",
      vendor: "maarmapa",
      version: "1.0.0",
    },
    endpoints: {
      mcp: `${baseUrl}/api/ucp/mcp`,
    },
    capabilities: {
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
    },
    auth: {
      type: "ucp-agent-profile",
      required_for: ["create_cart", "create_checkout", "complete_checkout"],
    },
    contact: { email: "mario@boykot.cl" },
  });
}

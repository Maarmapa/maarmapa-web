/**
 * UCP Catalog tools — search_catalog, lookup_catalog, get_product
 */

import { artworks, type Artwork } from "@/lib/artworks";
import {
  UCP_SHOP_GID_PREFIX,
  type UcpProduct,
} from "./types";

const CURRENCY = "CLP";
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://maarmapa.eth.limo";

function absoluteImageUrl(imagePath: string): string {
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  // Relative path → prepend base URL
  return `${BASE_URL}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
}

function artworkToProduct(art: Artwork): UcpProduct {
  const productId = `${UCP_SHOP_GID_PREFIX}/Artwork/${art.slug}`;
  const variantId = `${UCP_SHOP_GID_PREFIX}/ArtworkVariant/${art.slug}`;
  return {
    id: productId,
    handle: art.slug,
    title: art.title,
    description: { plain: art.description },
    url: `${BASE_URL}/obra/${art.slug}`,
    categories: [
      "Art > Painting",
      "Art > Original",
      art.technique.includes("Óleo") ? "Art > Oil Painting" : "Art > Acrylic",
    ],
    price_range: {
      min: { amount: art.priceClp, currency: CURRENCY },
      max: { amount: art.priceClp, currency: CURRENCY },
    },
    media: [
      {
        type: "image",
        url: absoluteImageUrl(art.image),
        alt_text: `${art.title} — ${art.technique} by maarmapa`,
      },
    ],
    options: [],
    variants: [
      {
        id: variantId,
        sku: null,
        title: art.edition,
        price: { amount: art.priceClp, currency: CURRENCY },
        available: art.status === "available",
        options: {},
      },
    ],
    metadata: {
      year: art.year,
      technique: art.technique,
      dimensions: art.dimensions,
      signed: art.signed,
      edition: art.edition,
      status: art.status,
      price_usd: art.priceUsd,
      price_usdc: art.priceUsd,
      inquiry_recommended: !!art.inquiryRecommended,
      ens_recipient: "maarmapa.eth",
      payment_methods: ["mercadopago", "khipu", "x402"],
    },
  };
}

export function getProductByGid(gid: string): UcpProduct | undefined {
  // accept both Artwork and ArtworkVariant gids
  const m = gid.match(/Artwork(?:Variant)?\/([\w-]+)$/);
  if (!m) return undefined;
  const slug = m[1];
  const art = artworks.find((a) => a.slug === slug);
  return art ? artworkToProduct(art) : undefined;
}

export function searchCatalog(query: string, limit = 10) {
  const q = query.trim().toLowerCase();
  if (!q) {
    return artworks.slice(0, limit).map(artworkToProduct);
  }
  const matches = artworks.filter((a) => {
    const blob = `${a.title} ${a.description} ${a.technique} ${a.year}`.toLowerCase();
    return blob.includes(q);
  });
  return matches.slice(0, limit).map(artworkToProduct);
}

export function lookupCatalog(ids: string[]) {
  return ids
    .map((id) => getProductByGid(id))
    .filter((p): p is UcpProduct => !!p);
}

export function getProductDetail(idOrHandle: string): UcpProduct | undefined {
  const byGid = getProductByGid(idOrHandle);
  if (byGid) return byGid;
  // fallback by handle
  const art = artworks.find((a) => a.slug === idOrHandle);
  return art ? artworkToProduct(art) : undefined;
}

// ─── MCP tool schemas ──────────────────────────────────────────
export const catalogTools = [
  {
    name: "search_catalog",
    description:
      "Search maarmapa's catalog of original paintings using free-text query. Returns matching artworks with price, media, availability and metadata.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Free-text search over title, description, technique.",
        },
        limit: {
          type: "integer",
          description: "Max results (default 10, max 50)",
          minimum: 1,
          maximum: 50,
        },
      },
      required: ["query"],
    },
  },
  {
    name: "lookup_catalog",
    description:
      "Batch resolve product GIDs to full product objects. Useful when you already have a list of artwork IDs.",
    inputSchema: {
      type: "object",
      properties: {
        ids: {
          type: "array",
          items: { type: "string" },
          maxItems: 10,
          description: "Array of product GIDs (gid://maarmapa/Artwork/<slug>)",
        },
      },
      required: ["ids"],
    },
  },
  {
    name: "get_product",
    description:
      "Get full details of one artwork by GID or handle (slug). Includes technique, dimensions, signature info, available payment methods.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Product GID or handle/slug (e.g. 'globefish')",
        },
      },
      required: ["id"],
    },
  },
] as const;

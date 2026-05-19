import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite imágenes desde Shopify CDN (mientras migramos a R2) y desde R2/Cloudflare
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "ipfs.io" },
      { protocol: "https", hostname: "**.ipfs.dweb.link" },
    ],
  },
  // Para deploy a IPFS (maarmapa.eth.limo) — usar `npm run export:ipfs`
  // output: "export",  // descomentar cuando hagas build estático para IPFS
  typedRoutes: true,
  // UCP discovery: agentes UCP-compliant esperan encontrar el manifest en
  // /.well-known/ucp.json — lo servimos desde /api/well-known/ucp
  async rewrites() {
    return [
      { source: "/.well-known/ucp.json", destination: "/api/well-known/ucp" },
      { source: "/.well-known/ucp", destination: "/api/well-known/ucp" },
    ];
  },
};

export default nextConfig;

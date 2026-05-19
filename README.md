# maarmapa-site

Tienda personal de obras originales de **maarmapa** (Mario Maldonado Parra), artista contemporáneo chileno. Reemplazo de Shopify por una stack propia, sin mensualidades fijas.

- **Dominios**: `maarmapa.eth.limo` (ENS gateway, gratis) y `maarmapa.vercel.app` (Vercel free tier)
- **Pagos**: Mercado Pago (Chile) · Khipu (Chile) · USDC vía **x402** (internacional crypto)
- **Stack**: Next.js 15 (App Router) · React 19 · Tailwind 4 · Supabase · viem (Base)
- **Agentic Commerce**: UCP-compliant (Universal Commerce Protocol) — agentes IA pueden descubrir y comprar obras vía `/api/ucp/mcp`

---

## 🚀 Cómo arrancar

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores reales

# Correr dev server
npm run dev
# → http://localhost:3000
```

---

## 📦 Estructura

```
maarmapa-site/
├── app/
│   ├── layout.tsx              # Layout global + nav + footer
│   ├── page.tsx                # Home — grilla de obras
│   ├── globals.css             # Tailwind v4 + tokens
│   ├── sobre/                  # /sobre — biografía
│   ├── contacto/               # /contacto — email + IG
│   ├── obra/[slug]/            # /obra/globefish — ficha + pagos
│   │   ├── page.tsx
│   │   └── PaymentOptions.tsx  # Botones de pago (client)
│   ├── checkout/
│   │   ├── x402/               # UI pago crypto + verificación
│   │   ├── exito/              # Confirmación
│   │   ├── pendiente/          # En proceso
│   │   └── error/              # Falló
│   └── api/
│       ├── checkout/
│       │   ├── mp/route.ts     # Crea preference MP
│       │   ├── khipu/route.ts  # Crea pago Khipu
│       │   └── x402/route.ts   # Crea orden x402
│       ├── webhooks/
│       │   └── mp/route.ts     # MP confirma pagos
│       └── x402/
│           └── verify/route.ts # Verifica tx USDC on-chain
├── lib/
│   ├── artworks.ts             # Carga catálogo + helpers
│   ├── supabase.ts             # Cliente Supabase + orders
│   ├── mercadopago.ts          # Cliente MP
│   ├── khipu.ts                # Cliente Khipu
│   └── x402.ts                 # Cliente Base/viem para USDC
└── data/
    └── artworks.json           # Catálogo de 7 obras
```

---

## 🗄️ Setup Supabase

En el SQL editor de Supabase, ejecutar:

```sql
create table if not exists maarmapa_orders (
  id uuid primary key default gen_random_uuid(),
  short_id text unique not null default substring(md5(random()::text), 1, 8),
  artwork_slug text not null,
  artwork_title text not null,
  price_clp integer not null,
  payment_method text not null check (payment_method in ('mp','khipu','x402','inquiry')),
  status text not null default 'pending' check (status in ('pending','paid','cancelled','expired')),
  buyer_email text,
  buyer_name text,
  buyer_phone text,
  buyer_country text,
  mp_preference_id text,
  mp_payment_id text,
  khipu_payment_id text,
  x402_tx_hash text,
  x402_payer_address text,
  notes text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  paid_at timestamptz,
  expires_at timestamptz default (now() + interval '24 hours')
);

create table if not exists maarmapa_inquiries (
  id uuid primary key default gen_random_uuid(),
  artwork_slug text,
  email text not null,
  name text,
  message text,
  handled boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_maarmapa_orders_status on maarmapa_orders(status);
create index if not exists idx_maarmapa_orders_short_id on maarmapa_orders(short_id);
```

---

## 💰 Configurar métodos de pago

### Mercado Pago
1. Crea cuenta en https://www.mercadopago.cl
2. Ve a **Developers → Credentials** y copia el **Access Token**
3. Pega en `.env.local` como `MP_ACCESS_TOKEN`
4. En **Developers → Webhooks**, configura URL: `https://TU_DOMINIO/api/webhooks/mp`

### Khipu
1. Crea cuenta en https://khipu.com
2. **Configuración → API** → genera API key
3. Pega en `.env.local` como `KHIPU_API_KEY`

### x402 (USDC en Base)
1. Si ya tenés `maarmapa.eth`, ve a https://app.ens.domains
2. Configura el **address record** apuntando a tu wallet de Base
3. Pega la dirección en `.env.local` como `X402_RECIPIENT_ADDRESS`
4. Asegúrate que tu wallet pueda recibir USDC en Base

---

## 🌐 Deploy

### Vercel (recomendado para empezar)

```bash
# Conectar repo a Vercel
vercel link

# Pushear variables de entorno
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add MP_ACCESS_TOKEN
vercel env add KHIPU_API_KEY
vercel env add X402_RECIPIENT_ADDRESS

# Deploy
vercel --prod
```

URL gratis: `https://maarmapa.vercel.app`

### IPFS / ENS (para maarmapa.eth.limo)

```bash
# Habilitar export estático en next.config.ts
# (descomentar la línea output: "export")

npm run export:ipfs
# → genera carpeta out-ipfs/

# Subir a IPFS con fleek.co, web3.storage, o ipfs-deploy
npx ipfs-deploy out-ipfs/
# → obtienes un CID

# Apuntar maarmapa.eth en app.ens.domains:
# Records → Content Hash → ipfs://CID_AQUI
```

Después accedés a:
- `https://maarmapa.eth.limo` (via gateway eth.limo)
- `https://maarmapa.eth.link` (alternativa)
- `https://CID.ipfs.dweb.link` (directo IPFS)

**⚠ Nota IPFS**: el deploy estático no incluye las rutas API (pagos). Para pagos, usar el deploy Vercel y enlazar desde el sitio IPFS, o usar Vercel directo.

---

## ✏️ Agregar / editar obras

Edita `data/artworks.json`. Cada obra:

```json
{
  "slug": "globefish",           // URL friendly, único
  "title": "GlobeFish",
  "year": 2024,
  "technique": "Óleo sobre lienzo",
  "dimensions": "120 × 90 cm",
  "signed": "Firmado al reverso",
  "priceClp": 9000000,
  "priceUsd": 9400,
  "status": "available",         // available | sold | reserved
  "edition": "Original — pieza única",
  "image": "https://...",         // ideal: subir a R2 de BOYKOT
  "description": "...",
  "inquiryRecommended": false    // true para obras +10M
}
```

---

## 🆚 Diferencias con Shopify

| Feature | Shopify | maarmapa-site |
|---------|---------|---------------|
| Mensualidad fija | ~$39 USD/mes | $0 |
| Comisión por venta | 0% (extra apps) | Solo la del medio de pago |
| Pagos crypto nativos | No | ✅ x402 |
| Dominio ENS | No | ✅ maarmapa.eth.limo |
| Branding propio | Limitado | Total |
| Velocidad | Media | Next.js 15 + cache |

---

## 🤖 UCP — Universal Commerce Protocol

maarmapa-web es **UCP-compliant** (spec versión `2026-04-08`). Esto significa que cualquier agente de IA (Claude, Cursor, Gemini, agentes custom) puede descubrir y operar sobre el catálogo de obras usando un protocolo estándar.

### Discovery

```bash
# Manifest del servidor
curl https://maarmapa.eth.limo/.well-known/ucp.json
```

### Endpoint MCP (JSON-RPC 2.0)

`POST /api/ucp/mcp`

### Tools disponibles

| Categoría | Tools |
|-----------|-------|
| **Catalog** | `search_catalog`, `lookup_catalog`, `get_product` |
| **Cart** | `create_cart`, `get_cart`, `update_cart`, `cancel_cart` |
| **Checkout** | `create_checkout`, `get_checkout`, `update_checkout`, `complete_checkout`, `cancel_checkout` |
| **Order** | `get_order` |

### Ejemplos

```bash
# Listar tools
curl -X POST https://maarmapa.eth.limo/api/ucp/mcp \
  -H "content-type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Buscar obras
curl -X POST https://maarmapa.eth.limo/api/ucp/mcp \
  -H "content-type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"search_catalog","arguments":{"query":"city"}}}'

# Detalle de obra
curl -X POST https://maarmapa.eth.limo/api/ucp/mcp \
  -H "content-type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_product","arguments":{"id":"globefish"}}}'

# Crear carrito
curl -X POST https://maarmapa.eth.limo/api/ucp/mcp \
  -H "content-type: application/json" \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"create_cart","arguments":{"line_items":[{"variant_id":"gid://maarmapa/ArtworkVariant/globefish","quantity":1}]}}}'
```

### Modelo de pagos en UCP

Como maarmapa soporta múltiples métodos (Mercado Pago, Khipu, x402 USDC), **el agente no procesa pagos directamente**. El flujo UCP es:

1. Agente busca obras (`search_catalog`)
2. Agente arma carrito (`create_cart`)
3. Agente inicia checkout (`create_checkout`) → respuesta `status: requires_escalation` + `continue_url`
4. Agente redirige al comprador a `continue_url` (página `/obra/[slug]` de maarmapa-web)
5. Comprador selecciona método de pago y completa
6. Agente puede consultar estado vía `get_order`

Esto es 100% compatible con el spec UCP de Shopify (versión 2026-04-08).

### Setup de tablas UCP

Las tablas `maarmapa_ucp_carts` y `maarmapa_ucp_checkouts` se crean al ejecutar la migración SQL:

```bash
# Copiar el contenido de supabase/migrations/0001_ucp_tables.sql
# Pegar en Supabase Dashboard → SQL Editor → Run
```

### Arquitectura UCP

```
lib/ucp/
├── types.ts          # Schemas TypeScript (UCP v2026-04-08)
├── catalog.ts        # search_catalog, lookup_catalog, get_product
├── cart.ts           # CRUD de carritos (Supabase-backed)
├── checkout.ts       # Sesiones de checkout (handoff a storefront)
└── order.ts          # Lookup de órdenes

app/api/
├── ucp/mcp/route.ts          # Endpoint JSON-RPC 2.0
└── well-known/ucp/route.ts   # Discovery manifest
```

---

## 📜 Licencia

Código: MIT
Obras: © Mario Maldonado Parra, todos los derechos reservados.

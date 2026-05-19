-- ─────────────────────────────────────────────────────────────
-- maarmapa-web · Supabase schema
-- Ejecutar en SQL Editor de Supabase tras conectar el proyecto.
-- ─────────────────────────────────────────────────────────────

-- ─── 1. Órdenes (Mercado Pago / Khipu / x402 / Inquiry) ──────
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

create index if not exists idx_maarmapa_orders_status on maarmapa_orders(status);
create index if not exists idx_maarmapa_orders_short_id on maarmapa_orders(short_id);
create index if not exists idx_maarmapa_orders_slug on maarmapa_orders(artwork_slug);

-- ─── 2. Consultas (inquiries — para obras de alto valor) ─────
create table if not exists maarmapa_inquiries (
  id uuid primary key default gen_random_uuid(),
  artwork_slug text,
  email text not null,
  name text,
  message text,
  handled boolean default false,
  created_at timestamptz default now()
);

-- ─── 3. UCP — Carritos ───────────────────────────────────────
create table if not exists maarmapa_ucp_carts (
  id uuid primary key default gen_random_uuid(),
  line_items jsonb not null default '[]'::jsonb,
  buyer jsonb,
  context jsonb,
  subtotal_clp integer not null default 0,
  total_clp integer not null default 0,
  status text not null default 'active' check (status in ('active','canceled','converted','expired')),
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '7 days')
);

create index if not exists idx_maarmapa_ucp_carts_status on maarmapa_ucp_carts(status);
create index if not exists idx_maarmapa_ucp_carts_expires on maarmapa_ucp_carts(expires_at);

-- ─── 4. UCP — Checkouts ──────────────────────────────────────
create table if not exists maarmapa_ucp_checkouts (
  id uuid primary key default gen_random_uuid(),
  access_key text not null default substring(md5(random()::text), 1, 16),
  cart_id uuid references maarmapa_ucp_carts(id) on delete set null,
  order_short_id text references maarmapa_orders(short_id) on delete set null,
  status text not null default 'incomplete'
    check (status in ('incomplete','requires_escalation','ready_for_complete','completed','canceled')),
  line_items jsonb not null default '[]'::jsonb,
  buyer jsonb,
  fulfillment jsonb,
  payment jsonb,
  subtotal_clp integer not null default 0,
  total_clp integer not null default 0,
  created_at timestamptz default now(),
  completed_at timestamptz
);

create index if not exists idx_maarmapa_ucp_checkouts_status on maarmapa_ucp_checkouts(status);

-- ─── 5. RLS (Row Level Security) ─────────────────────────────
-- Por defecto, las tablas solo se acceden con service_role key.
-- Si queremos exponer lecturas públicas (ej: get_order por short_id),
-- habilitar policies específicas.

alter table maarmapa_orders enable row level security;
alter table maarmapa_inquiries enable row level security;
alter table maarmapa_ucp_carts enable row level security;
alter table maarmapa_ucp_checkouts enable row level security;

-- No agregamos policies aquí → todas las queries deben venir desde el
-- backend con SUPABASE_SERVICE_ROLE_KEY (lo que ya hacemos en lib/supabase.ts).

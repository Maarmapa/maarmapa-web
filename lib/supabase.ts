// Cliente Supabase para registrar órdenes y consultas de maarmapa.
// Reusa la misma instancia de Supabase de BOYKOT — tabla separada para no mezclar.
//
// SCHEMA esperado (correr en Supabase SQL editor):
//
// create table if not exists maarmapa_orders (
//   id uuid primary key default gen_random_uuid(),
//   short_id text unique not null default substring(md5(random()::text), 1, 8),
//   artwork_slug text not null,
//   artwork_title text not null,
//   price_clp integer not null,
//   payment_method text not null check (payment_method in ('mp','khipu','x402','inquiry')),
//   status text not null default 'pending' check (status in ('pending','paid','cancelled','expired')),
//   buyer_email text,
//   buyer_name text,
//   buyer_phone text,
//   buyer_country text,
//   mp_preference_id text,
//   mp_payment_id text,
//   khipu_payment_id text,
//   x402_tx_hash text,
//   x402_payer_address text,
//   notes text,
//   metadata jsonb default '{}'::jsonb,
//   created_at timestamptz default now(),
//   paid_at timestamptz,
//   expires_at timestamptz default (now() + interval '24 hours')
// );
//
// create table if not exists maarmapa_inquiries (
//   id uuid primary key default gen_random_uuid(),
//   artwork_slug text,
//   email text not null,
//   name text,
//   message text,
//   handled boolean default false,
//   created_at timestamptz default now()
// );

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en variables de entorno."
    );
  }
  _client = createClient(url, key, {
    auth: { persistSession: false },
  });
  return _client;
}

export type MaarmapaOrder = {
  id: string;
  short_id: string;
  artwork_slug: string;
  artwork_title: string;
  price_clp: number;
  payment_method: "mp" | "khipu" | "x402" | "inquiry";
  status: "pending" | "paid" | "cancelled" | "expired";
  buyer_email?: string;
  mp_preference_id?: string;
  mp_payment_id?: string;
  x402_tx_hash?: string;
  created_at: string;
  paid_at?: string;
};

export async function createOrder(
  data: Partial<MaarmapaOrder> & {
    artwork_slug: string;
    artwork_title: string;
    price_clp: number;
    payment_method: MaarmapaOrder["payment_method"];
  }
): Promise<MaarmapaOrder> {
  const sb = supabase();
  const { data: order, error } = await sb
    .from("maarmapa_orders")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return order as MaarmapaOrder;
}

export async function markOrderPaid(
  shortId: string,
  details: Partial<MaarmapaOrder>
): Promise<void> {
  const sb = supabase();
  const { error } = await sb
    .from("maarmapa_orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      ...details,
    })
    .eq("short_id", shortId);
  if (error) throw error;
}

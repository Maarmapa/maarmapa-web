// Cliente Mercado Pago para maarmapa
// Crea una "preference" (intent de pago) y devuelve la URL de checkout.
// El webhook recibe la confirmación y marca la orden como paid en Supabase.

import { MercadoPagoConfig, Preference } from "mercadopago";
import type { Artwork } from "./artworks";

let _client: MercadoPagoConfig | null = null;

function mp(): MercadoPagoConfig {
  if (_client) return _client;
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Falta MP_ACCESS_TOKEN en variables de entorno.");
  }
  _client = new MercadoPagoConfig({ accessToken: token });
  return _client;
}

export async function createPreference(
  artwork: Artwork,
  shortId: string,
  origin: string
): Promise<{ id: string; init_point: string }> {
  const pref = new Preference(mp());
  const result = await pref.create({
    body: {
      items: [
        {
          id: artwork.slug,
          title: `${artwork.title} — obra original por maarmapa`,
          description: `${artwork.technique} · ${artwork.dimensions} · ${artwork.year}`,
          picture_url: artwork.image,
          category_id: "art",
          quantity: 1,
          currency_id: "CLP",
          unit_price: artwork.priceClp,
        },
      ],
      external_reference: shortId,
      back_urls: {
        success: `${origin}/checkout/exito?order=${shortId}`,
        pending: `${origin}/checkout/pendiente?order=${shortId}`,
        failure: `${origin}/checkout/error?order=${shortId}`,
      },
      auto_return: "approved",
      notification_url: `${origin}/api/webhooks/mp`,
      statement_descriptor: "MAARMAPA",
      metadata: { artwork_slug: artwork.slug, short_id: shortId },
    },
  });

  if (!result.id || !result.init_point) {
    throw new Error("Mercado Pago no devolvió preference válida.");
  }
  return { id: result.id, init_point: result.init_point };
}

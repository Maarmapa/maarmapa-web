// Cliente Khipu — pagos por transferencia bancaria en Chile
// Docs: https://khipu.com/page/api
//
// Khipu requiere registrarse y obtener:
//   - KHIPU_RECEIVER_ID
//   - KHIPU_SECRET
// y configurar webhook URL en su panel.

import type { Artwork } from "./artworks";

const KHIPU_BASE = "https://payment-api.khipu.com/v3";

export async function createKhipuPayment(
  artwork: Artwork,
  shortId: string,
  origin: string
): Promise<{ payment_url: string; payment_id: string }> {
  const key = process.env.KHIPU_API_KEY;
  if (!key) throw new Error("Falta KHIPU_API_KEY");

  const res = await fetch(`${KHIPU_BASE}/payments`, {
    method: "POST",
    headers: {
      "x-api-key": key,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      subject: `${artwork.title} — maarmapa`,
      currency: "CLP",
      amount: artwork.priceClp,
      transaction_id: shortId,
      return_url: `${origin}/checkout/exito?order=${shortId}`,
      cancel_url: `${origin}/checkout/error?order=${shortId}`,
      notify_url: `${origin}/api/webhooks/khipu`,
      notify_api_version: "3.0",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Khipu API error ${res.status}: ${text}`);
  }
  const data: { payment_url: string; payment_id: string } = await res.json();
  return data;
}

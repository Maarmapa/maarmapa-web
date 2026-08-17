import { NextResponse } from "next/server";
import { getArtwork } from "@/lib/artworks";
import { createOrder } from "@/lib/supabase";
import {
  getPaymentRecipient,
  PaymentRecipientUnavailableError,
} from "@/lib/x402";

export const runtime = "nodejs";

// Para x402, en lugar de redirigir a otra URL, devolvemos un "url" que
// apunta a una página de pago dentro de nuestro sitio que muestra el
// QR / botón de wallet y maneja el handshake.
export async function POST(req: Request) {
  try {
    const { slug } = (await req.json()) as { slug?: string };
    if (!slug) {
      return NextResponse.json({ message: "Falta slug" }, { status: 400 });
    }
    const artwork = getArtwork(slug);
    if (!artwork || artwork.status !== "available") {
      return NextResponse.json(
        { message: "Obra no disponible" },
        { status: 404 }
      );
    }

    // Sin dirección receptora (env o maarmapa.eth vía ENS) no abrimos orden:
    // 503 antes de mandar al comprador a una página de pago sin destino.
    await getPaymentRecipient();

    const order = await createOrder({
      artwork_slug: artwork.slug,
      artwork_title: artwork.title,
      price_clp: artwork.priceClp,
      payment_method: "x402",
    });

    const origin = new URL(req.url).origin;
    return NextResponse.json({
      url: `${origin}/checkout/x402?order=${order.short_id}&slug=${artwork.slug}`,
    });
  } catch (e) {
    if (e instanceof PaymentRecipientUnavailableError) {
      console.error(e.message);
      return NextResponse.json(
        { message: "Pago USDC temporalmente no disponible" },
        { status: 503 }
      );
    }
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}

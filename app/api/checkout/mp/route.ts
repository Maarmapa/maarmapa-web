import { NextResponse } from "next/server";
import { getArtwork } from "@/lib/artworks";
import { createPreference } from "@/lib/mercadopago";
import { createOrder } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { slug } = (await req.json()) as { slug?: string };
    if (!slug) {
      return NextResponse.json({ message: "Falta slug" }, { status: 400 });
    }
    const artwork = getArtwork(slug);
    if (!artwork) {
      return NextResponse.json(
        { message: "Obra no encontrada" },
        { status: 404 }
      );
    }
    if (artwork.status !== "available") {
      return NextResponse.json(
        { message: "Obra no disponible" },
        { status: 409 }
      );
    }

    const origin = new URL(req.url).origin;
    const order = await createOrder({
      artwork_slug: artwork.slug,
      artwork_title: artwork.title,
      price_clp: artwork.priceClp,
      payment_method: "mp",
    });
    const pref = await createPreference(artwork, order.short_id, origin);
    return NextResponse.json({ url: pref.init_point, short_id: order.short_id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}

// Endpoint que el cliente llama después de enviar la tx USDC.
// Recibe { order, txHash } y verifica on-chain que el pago llegó.

import { NextResponse } from "next/server";
import { artworks } from "@/lib/artworks";
import {
  artworkToUsdcAmount,
  PAYMENT_RECIPIENT,
  verifyUsdcPayment,
} from "@/lib/x402";
import { markOrderPaid, supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { order, txHash } = (await req.json()) as {
      order?: string;
      txHash?: `0x${string}`;
    };
    if (!order || !txHash) {
      return NextResponse.json(
        { ok: false, message: "Falta order o txHash" },
        { status: 400 }
      );
    }

    const sb = supabase();
    const { data: row, error } = await sb
      .from("maarmapa_orders")
      .select("*")
      .eq("short_id", order)
      .single();
    if (error || !row) {
      return NextResponse.json(
        { ok: false, message: "Orden no encontrada" },
        { status: 404 }
      );
    }

    const artwork = artworks.find((a) => a.slug === row.artwork_slug);
    if (!artwork) {
      return NextResponse.json(
        { ok: false, message: "Obra no encontrada" },
        { status: 404 }
      );
    }

    const expected = artworkToUsdcAmount(artwork);
    const result = await verifyUsdcPayment(txHash, expected, PAYMENT_RECIPIENT);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: result.reason },
        { status: 402 }
      );
    }

    await markOrderPaid(order, {
      x402_tx_hash: txHash,
    });

    return NextResponse.json({
      ok: true,
      payer: result.payer,
      amount: result.amount?.toString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "verify error";
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}

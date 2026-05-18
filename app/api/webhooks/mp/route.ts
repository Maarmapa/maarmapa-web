// Webhook Mercado Pago — recibe notificaciones de pago y marca órdenes como paid.
// Configurar en MP dashboard: notification_url = https://maarmapa.vercel.app/api/webhooks/mp

import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { markOrderPaid } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      type?: string;
      data?: { id?: string };
    };

    // MP envía varios tipos de notificación; nos interesa "payment"
    if (body.type !== "payment" || !body.data?.id) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) {
      return NextResponse.json(
        { ok: false, message: "Falta MP_ACCESS_TOKEN" },
        { status: 500 }
      );
    }
    const payment = new Payment(new MercadoPagoConfig({ accessToken: token }));
    const info = await payment.get({ id: body.data.id });

    const shortId = info.external_reference;
    const status = info.status; // approved | pending | rejected | cancelled
    if (!shortId) {
      return NextResponse.json({ ok: true, no_ref: true });
    }

    if (status === "approved") {
      await markOrderPaid(shortId, {
        mp_payment_id: String(info.id),
      });
    }

    return NextResponse.json({ ok: true, status });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "webhook error";
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}

// MP a veces hace GET con query string en vez de POST
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("data.id") || url.searchParams.get("id");
  const type = url.searchParams.get("type") || url.searchParams.get("topic");
  if (type === "payment" && id) {
    // Re-emitimos como si fuera POST
    return POST(
      new Request(req.url, {
        method: "POST",
        body: JSON.stringify({ type: "payment", data: { id } }),
        headers: { "content-type": "application/json" },
      })
    );
  }
  return NextResponse.json({ ok: true });
}

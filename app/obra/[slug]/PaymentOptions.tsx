"use client";

import { useState } from "react";
import type { Artwork } from "@/lib/artworks";

type Method = "mp" | "khipu" | "x402" | "inquiry";

export function PaymentOptions({ artwork }: { artwork: Artwork }) {
  const [loading, setLoading] = useState<Method | null>(null);
  const [error, setError] = useState<string | null>(null);

  const highValue =
    artwork.priceClp >= 10_000_000 || artwork.inquiryRecommended;

  async function startCheckout(method: Method) {
    setError(null);
    setLoading(method);
    try {
      if (method === "inquiry") {
        const subject = encodeURIComponent(
          `interés en obra: ${artwork.title}`
        );
        const body = encodeURIComponent(
          `hola maarmapa,\n\nme interesa la obra "${artwork.title}" (${artwork.dimensions}).\nquisiera más información sobre disponibilidad, envío y formas de pago.\n\ngracias.`
        );
        window.location.href = `mailto:mario@boykot.cl?subject=${subject}&body=${body}`;
        return;
      }

      const res = await fetch(`/api/checkout/${method}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: artwork.slug }),
      });
      if (!res.ok) throw new Error(`error ${res.status}`);
      const data: { url?: string; message?: string } = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.message) {
        setError(data.message);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "error desconocido";
      setError(msg);
    } finally {
      setLoading(null);
    }
  }

  if (artwork.status === "sold") {
    return (
      <div className="border border-[var(--color-gray)] p-5 text-center">
        <p className="font-mono text-[10px] font-bold text-[var(--color-dim)] tracking-[0.2em] uppercase mb-2">
          ── unavailable
        </p>
        <p className="font-mono text-xs text-[var(--color-aaa)]">
          this work has been sold.
        </p>
        <p className="font-mono text-[10px] text-[var(--color-dim)] mt-2">
          contact maarmapa for similar pieces
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="font-mono text-[9px] font-bold text-[var(--color-dim)] tracking-[0.2em] uppercase mb-2">
        ── select payment method
      </div>

      {highValue && (
        <button
          onClick={() => startCheckout("inquiry")}
          className="btn-p w-full !text-left !block"
          style={{ padding: "14px 22px" }}
        >
          ✉ consultar disponibilidad y envío ↗
        </button>
      )}

      <button
        onClick={() => startCheckout("mp")}
        disabled={loading !== null}
        className="btn-g w-full !text-left !block"
        style={{ padding: "14px 22px" }}
      >
        {loading === "mp" ? "loading…" : "🇨🇱 mercado pago · cards / cuotas"}
      </button>

      <button
        onClick={() => startCheckout("khipu")}
        disabled={loading !== null}
        className="btn-g w-full !text-left !block"
        style={{ padding: "14px 22px" }}
      >
        {loading === "khipu" ? "loading…" : "🏦 khipu · bank transfer (cl)"}
      </button>

      <button
        onClick={() => startCheckout("x402")}
        disabled={loading !== null}
        className="btn-green-outline w-full !text-left !block"
        style={{ padding: "14px 22px" }}
      >
        {loading === "x402" ? "loading…" : "⚡ x402 · usdc on base ✦"}
      </button>

      {!highValue && (
        <button
          onClick={() => startCheckout("inquiry")}
          className="w-full font-mono text-[10px] text-[var(--color-dim)] tracking-wider uppercase pt-3 hover:text-[var(--color-green)] transition-colors"
        >
          → or write to the artist
        </button>
      )}

      {error && (
        <p className="font-mono text-xs text-[var(--color-pink)] mt-3">
          ⚠ {error}
        </p>
      )}
    </div>
  );
}

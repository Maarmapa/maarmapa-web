"use client";

import { useState } from "react";
import type { Artwork } from "@/lib/artworks";

type Method = "mp" | "khipu" | "x402" | "inquiry";

export function PaymentOptions({ artwork }: { artwork: Artwork }) {
  const [loading, setLoading] = useState<Method | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Para obras de alto valor recomendamos consultar primero
  const highValue =
    artwork.priceClp >= 10_000_000 || artwork.inquiryRecommended;

  async function startCheckout(method: Method) {
    setError(null);
    setLoading(method);
    try {
      if (method === "inquiry") {
        const subject = encodeURIComponent(
          `Interés en obra: ${artwork.title}`
        );
        const body = encodeURIComponent(
          `Hola maarmapa,\n\nMe interesa la obra "${artwork.title}" (${artwork.dimensions}).\n` +
            `Quisiera más información sobre disponibilidad, envío y formas de pago.\n\nGracias.`
        );
        window.location.href = `mailto:mario@boykot.cl?subject=${subject}&body=${body}`;
        return;
      }

      const res = await fetch(`/api/checkout/${method}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: artwork.slug }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data: { url?: string; message?: string } = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.message) {
        setError(data.message);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setError(msg);
    } finally {
      setLoading(null);
    }
  }

  if (artwork.status === "sold") {
    return (
      <div className="mt-6 p-4 bg-black text-white text-center">
        <p className="font-medium">Obra vendida</p>
        <p className="text-sm text-white/70 mt-1">
          Ya no se encuentra disponible. Contacta a maarmapa por obras
          similares.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {highValue && (
        <button
          onClick={() => startCheckout("inquiry")}
          className="w-full py-4 bg-[var(--color-ink)] text-[var(--color-canvas)] font-medium hover:bg-[var(--color-gold)] transition-colors"
        >
          ✉ Consultar disponibilidad y envío
        </button>
      )}

      <button
        onClick={() => startCheckout("mp")}
        disabled={loading !== null}
        className="w-full py-3 border border-black/20 hover:border-black hover:bg-black hover:text-white transition disabled:opacity-50 text-sm"
      >
        {loading === "mp" ? "Cargando…" : "🇨🇱 Pagar con Mercado Pago"}
      </button>

      <button
        onClick={() => startCheckout("khipu")}
        disabled={loading !== null}
        className="w-full py-3 border border-black/20 hover:border-black hover:bg-black hover:text-white transition disabled:opacity-50 text-sm"
      >
        {loading === "khipu" ? "Cargando…" : "🏦 Transferencia (Khipu)"}
      </button>

      <button
        onClick={() => startCheckout("x402")}
        disabled={loading !== null}
        className="w-full py-3 border border-black/20 hover:border-black hover:bg-black hover:text-white transition disabled:opacity-50 text-sm"
      >
        {loading === "x402" ? "Cargando…" : "⚡ Pagar con USDC (x402, Base)"}
      </button>

      {!highValue && (
        <button
          onClick={() => startCheckout("inquiry")}
          className="w-full py-3 text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]"
        >
          O escribir al artista directamente →
        </button>
      )}

      {error && (
        <p className="text-sm text-red-600 mt-2">⚠ {error}</p>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";

export function X402Verify({ order }: { order: string }) {
  const [hash, setHash] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<
    { ok: true; payer?: string } | { ok: false; message: string } | null
  >(null);

  async function verify() {
    if (!hash.startsWith("0x") || hash.length < 60) {
      setResult({ ok: false, message: "Hash inválido" });
      return;
    }
    setVerifying(true);
    setResult(null);
    try {
      const res = await fetch("/api/x402/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order, txHash: hash }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setResult({ ok: true, payer: data.payer });
      } else {
        setResult({ ok: false, message: data.message || "Error" });
      }
    } catch (e) {
      setResult({
        ok: false,
        message: e instanceof Error ? e.message : "Error de red",
      });
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="mt-6 pt-6 border-t border-black/10">
      <label className="text-sm font-medium">Hash de tu transacción</label>
      <input
        type="text"
        placeholder="0x..."
        value={hash}
        onChange={(e) => setHash(e.target.value.trim())}
        className="mt-2 w-full p-3 border border-black/20 font-mono text-xs"
      />
      <button
        onClick={verify}
        disabled={verifying || !hash}
        className="mt-3 w-full py-3 bg-[var(--color-ink)] text-[var(--color-canvas)] disabled:opacity-50 hover:bg-[var(--color-gold)] transition"
      >
        {verifying ? "Verificando on-chain…" : "Verificar pago"}
      </button>

      {result?.ok && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 text-sm">
          <p className="font-medium text-green-900">✓ Pago verificado</p>
          <p className="mt-1 text-green-700">
            Tu obra ya está reservada. Te contactaremos por email para
            coordinar el envío.
          </p>
          {result.payer && (
            <p className="text-xs mt-2 font-mono text-green-700">
              Desde: {result.payer}
            </p>
          )}
        </div>
      )}
      {result && !result.ok && (
        <p className="mt-3 text-sm text-red-600">⚠ {result.message}</p>
      )}
    </div>
  );
}

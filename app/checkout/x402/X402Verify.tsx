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
      setResult({ ok: false, message: "invalid hash" });
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
        setResult({ ok: false, message: data.message || "error" });
      }
    } catch (e) {
      setResult({
        ok: false,
        message: e instanceof Error ? e.message : "network error",
      });
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="border border-[var(--color-gray)] p-5 mb-6">
      <label className="font-mono text-[9px] text-[var(--color-dim)] uppercase tracking-[0.2em] mb-2 block">
        ── transaction hash
      </label>
      <input
        type="text"
        placeholder="0x..."
        value={hash}
        onChange={(e) => setHash(e.target.value.trim())}
        className="w-full p-3 bg-[var(--color-black)] border border-[var(--color-gray)] focus:border-[var(--color-green)] outline-none font-mono text-[11px] text-[var(--color-white)] transition-colors"
      />
      <button
        onClick={verify}
        disabled={verifying || !hash}
        className="btn-p w-full mt-3"
      >
        {verifying ? "verifying on-chain…" : "verify payment ↗"}
      </button>

      {result?.ok && (
        <div className="mt-4 p-4 border border-[var(--color-green)] bg-[var(--color-green)]/5">
          <p className="font-mono text-[10px] font-bold text-[var(--color-green)] tracking-[0.2em] uppercase mb-2">
            ✓ payment verified
          </p>
          <p className="font-mono text-xs text-[var(--color-aaa)]">
            tu obra ya está reservada. te contactaremos por email para
            coordinar el envío.
          </p>
          {result.payer && (
            <p className="font-mono text-[10px] text-[var(--color-dim)] mt-2 break-all">
              from: <span className="text-[var(--color-green)]">{result.payer}</span>
            </p>
          )}
        </div>
      )}
      {result && !result.ok && (
        <p className="mt-3 font-mono text-xs text-[var(--color-pink)]">
          ⚠ {result.message}
        </p>
      )}
    </div>
  );
}

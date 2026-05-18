import Link from "next/link";
import { getArtwork, formatUsd } from "@/lib/artworks";
import { PAYMENT_RECIPIENT, USDC_BASE } from "@/lib/x402";
import { X402Verify } from "./X402Verify";

export default async function X402CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; slug?: string }>;
}) {
  const { order, slug } = await searchParams;
  const artwork = slug ? getArtwork(slug) : undefined;

  if (!order || !artwork) {
    return (
      <div className="pt-16 pb-16 text-center">
        <p className="text-4xl text-[var(--color-pink)] mb-4">⚠</p>
        <h1 className="font-display text-3xl font-black">missing data</h1>
        <p className="font-mono text-xs text-[var(--color-aaa)] mt-3">
          <Link href="/" className="underline hover:text-[var(--color-green)]">
            ← back to catalog
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="pt-8 pb-16">
      <Link
        href={`/obra/${artwork.slug}`}
        className="font-mono text-[10px] text-[var(--color-dim)] tracking-wider lowercase hover:text-[var(--color-green)] transition-colors"
      >
        ← back to {artwork.title.toLowerCase()}
      </Link>

      <div className="mt-6 border-b border-[var(--color-gray)] pb-6">
        <div className="font-mono text-[9px] font-bold text-[var(--color-pink)] tracking-[0.3em] uppercase mb-3">
          ── x402 · pay with usdc
        </div>
        <h1 className="font-display text-[clamp(32px,9vw,56px)] font-black tracking-[-0.03em] leading-[0.92]">
          usdc
          <span className="block text-[var(--color-pink)]">on base.</span>
        </h1>
        <p className="font-mono text-[11px] text-[var(--color-dim)] mt-2">
          order{" "}
          <code className="text-[var(--color-green)]">{order}</code> ·{" "}
          {artwork.title}
        </p>
      </div>

      {/* Amount block */}
      <div className="border border-[var(--color-gray)] p-5 my-6">
        <p className="font-mono text-[9px] text-[var(--color-dim)] uppercase tracking-[0.2em] mb-2">
          amount due
        </p>
        <p className="font-display text-4xl font-black text-[var(--color-white)] tracking-[-0.02em]">
          {formatUsd(artwork.priceUsd)}{" "}
          <span className="text-[var(--color-pink)]">USDC</span>
        </p>
        <p className="font-mono text-[10px] text-[var(--color-dim)] mt-1">
          network: <span className="text-[var(--color-green)]">base</span>
        </p>
      </div>

      {/* Recipient block */}
      <div className="border border-[var(--color-gray)] p-5 mb-6">
        <p className="font-mono text-[9px] text-[var(--color-dim)] uppercase tracking-[0.2em] mb-2">
          send to
        </p>
        <code className="block font-mono text-[11px] text-[var(--color-green)] break-all leading-relaxed">
          {PAYMENT_RECIPIENT}
        </code>
        <p className="font-mono text-[10px] text-[var(--color-dim)] mt-2">
          ens:{" "}
          <span className="text-[var(--color-pink)]">maarmapa.eth</span>
        </p>
        <p className="font-mono text-[10px] text-[var(--color-dim)] mt-1">
          asset:{" "}
          <code className="text-[var(--color-aaa)]">{USDC_BASE}</code>
        </p>
      </div>

      <X402Verify order={order} />

      {/* Instructions terminal */}
      <div className="terminal mt-8">
        <div className="terminal-header">
          <span className="t-dot t-red"></span>
          <span className="t-dot t-yellow"></span>
          <span className="t-dot t-green-dot"></span>
          <span className="t-title">~/how-to-pay</span>
        </div>
        <div className="terminal-body">
          <div className="t-line">
            <span className="prompt">$</span>{" "}
            <span className="cmd">cat instructions.txt</span>
          </div>
          <div className="t-line">
            <span className="out">
              1. abre tu wallet (coinbase wallet · rainbow · metamask)
            </span>
          </div>
          <div className="t-line">
            <span className="out">2. cambia a red base</span>
          </div>
          <div className="t-line">
            <span className="out">
              3. envía exactamente{" "}
              <span className="text-[var(--color-pink)]">
                {artwork.priceUsd} USDC
              </span>{" "}
              a la dirección de arriba
            </span>
          </div>
          <div className="t-line">
            <span className="out">
              4. copia el hash de tu transacción y pégalo arriba
            </span>
          </div>
          <div className="t-line">
            <span className="pink-out">
              ✦ tip: coinbase smart wallet permite pagar con tarjeta sin
              tener crypto.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

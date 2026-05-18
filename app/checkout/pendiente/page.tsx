import Link from "next/link";

export default function CheckoutPendingPage() {
  return (
    <div className="pt-16 pb-16 text-center">
      <div className="font-mono text-[10px] font-bold text-[var(--color-pink)] tracking-[0.3em] uppercase mb-4">
        ── awaiting_confirmation
      </div>
      <p className="text-5xl mb-4">⏳</p>
      <h1 className="font-display text-[clamp(32px,9vw,56px)] font-black tracking-[-0.03em] leading-[0.92] mb-4">
        pending.
      </h1>
      <p className="font-mono text-xs text-[var(--color-aaa)] max-w-[420px] mx-auto leading-[1.8] mb-6">
        tu pago está siendo procesado. recibirás un email cuando se
        confirme.
      </p>
      <Link href="/" className="btn-g inline-block mt-6">
        ← back to catalog
      </Link>
    </div>
  );
}

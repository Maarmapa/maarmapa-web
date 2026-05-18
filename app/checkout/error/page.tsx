import Link from "next/link";

export default function CheckoutErrorPage() {
  return (
    <div className="pt-16 pb-16 text-center">
      <div className="font-mono text-[10px] font-bold text-[var(--color-pink)] tracking-[0.3em] uppercase mb-4">
        ── error
      </div>
      <p className="text-5xl text-[var(--color-pink)] mb-4">⚠</p>
      <h1 className="font-display text-[clamp(32px,9vw,56px)] font-black tracking-[-0.03em] leading-[0.92] mb-4">
        something
        <span className="block text-[var(--color-pink)]">broke.</span>
      </h1>
      <p className="font-mono text-xs text-[var(--color-aaa)] max-w-[420px] mx-auto leading-[1.8] mb-8">
        no pudimos completar el pago. puedes intentar otro método o
        escribirnos directamente.
      </p>
      <div className="flex flex-col gap-3 items-center">
        <Link href="/" className="btn-g">
          ← back to catalog
        </Link>
        <a href="mailto:mario@boykot.cl" className="btn-p">
          ✉ contact maarmapa
        </a>
      </div>
    </div>
  );
}

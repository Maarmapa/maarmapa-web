import Link from "next/link";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  return (
    <div className="pt-16 pb-16 text-center">
      <div className="font-mono text-[10px] font-bold text-[var(--color-green)] tracking-[0.3em] uppercase mb-4">
        ── payment_confirmed
      </div>
      <p className="text-5xl text-[var(--color-green)] mb-4">✓</p>
      <h1 className="font-display text-[clamp(32px,9vw,56px)] font-black tracking-[-0.03em] leading-[0.92] mb-4">
        thanks.
      </h1>
      <p className="font-mono text-xs text-[var(--color-aaa)] max-w-[420px] mx-auto leading-[1.8] mb-6">
        tu pago fue recibido. te contactaremos por email en las próximas
        horas para coordinar el envío con seguro.
      </p>
      {order && (
        <div className="terminal max-w-[420px] mx-auto text-left">
          <div className="terminal-header">
            <span className="t-dot t-red"></span>
            <span className="t-dot t-yellow"></span>
            <span className="t-dot t-green-dot"></span>
            <span className="t-title">~/order</span>
          </div>
          <div className="terminal-body">
            <div className="t-line">
              <span className="prompt">$</span>{" "}
              <span className="cmd">show order_id</span>
            </div>
            <div className="t-line">
              <span className="out">→ {order}</span>
            </div>
          </div>
        </div>
      )}
      <Link href="/" className="btn-p inline-block mt-10">
        ← back to catalog
      </Link>
    </div>
  );
}

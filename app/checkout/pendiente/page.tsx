import Link from "next/link";

export default function CheckoutPendingPage() {
  return (
    <div className="container-narrow py-24 text-center">
      <p className="text-5xl">⏳</p>
      <h1 className="font-display text-4xl mt-4">Pago pendiente</h1>
      <p className="mt-4 text-[var(--color-muted)]">
        Tu pago está siendo procesado. Recibirás un email cuando se confirme.
      </p>
      <Link
        href="/"
        className="inline-block mt-10 underline hover:text-[var(--color-gold)]"
      >
        ← Volver a la galería
      </Link>
    </div>
  );
}

import Link from "next/link";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  return (
    <div className="container-narrow py-24 text-center">
      <p className="text-5xl">✓</p>
      <h1 className="font-display text-4xl mt-4">Gracias por tu compra</h1>
      <p className="mt-4 text-[var(--color-muted)]">
        Tu pago fue recibido. Te contactaremos por email en las próximas
        horas para coordinar el envío con seguro.
      </p>
      {order && (
        <p className="mt-6 text-sm">
          Número de orden: <code className="bg-black/5 px-2 py-1">{order}</code>
        </p>
      )}
      <Link
        href="/"
        className="inline-block mt-10 underline hover:text-[var(--color-gold)]"
      >
        ← Volver a la galería
      </Link>
    </div>
  );
}

import Link from "next/link";

export default function CheckoutErrorPage() {
  return (
    <div className="container-narrow py-24 text-center">
      <p className="text-5xl">⚠</p>
      <h1 className="font-display text-4xl mt-4">Algo salió mal</h1>
      <p className="mt-4 text-[var(--color-muted)]">
        No pudimos completar el pago. Puedes intentar otro método o
        escribirnos directamente.
      </p>
      <div className="mt-10 flex flex-col gap-3 items-center">
        <Link href="/" className="underline">
          Volver a la galería
        </Link>
        <a
          href="mailto:mario@boykot.cl"
          className="underline hover:text-[var(--color-gold)]"
        >
          mario@boykot.cl
        </a>
      </div>
    </div>
  );
}

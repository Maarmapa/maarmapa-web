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
      <div className="container-narrow py-24">
        <h1 className="font-display text-3xl">Datos faltantes</h1>
        <p className="mt-4 text-[var(--color-muted)]">
          No se encuentra la orden. <Link href="/" className="underline">Volver al inicio</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="container-narrow py-16">
      <Link href={`/obra/${artwork.slug}`} className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]">
        ← Volver a la obra
      </Link>

      <h1 className="font-display text-4xl mt-6">Pago con USDC en Base</h1>
      <p className="mt-2 text-[var(--color-muted)]">
        Orden <code className="bg-black/5 px-2 py-0.5 rounded">{order}</code> · {artwork.title}
      </p>

      <div className="mt-10 p-6 border border-black/10 bg-white">
        <p className="text-sm text-[var(--color-muted)]">Monto a pagar</p>
        <p className="font-display text-4xl mt-1">{formatUsd(artwork.priceUsd)} USDC</p>
        <p className="text-xs text-[var(--color-muted)] mt-1">
          Red: <strong>Base</strong> · Token: USDC ({USDC_BASE})
        </p>

        <div className="mt-6 pt-6 border-t border-black/10">
          <p className="text-sm font-medium">Dirección destino</p>
          <code className="block mt-2 text-xs bg-black/5 p-3 break-all">
            {PAYMENT_RECIPIENT}
          </code>
          <p className="text-xs text-[var(--color-muted)] mt-2">
            ENS: maarmapa.eth
          </p>
        </div>

        <X402Verify order={order} />
      </div>

      <div className="mt-8 p-4 bg-amber-50 border border-amber-200 text-sm">
        <p className="font-medium">¿Cómo pagar?</p>
        <ol className="mt-2 list-decimal list-inside space-y-1 text-[var(--color-muted)]">
          <li>Abre tu wallet (Coinbase Wallet, Rainbow, MetaMask) en red Base</li>
          <li>Asegúrate de tener USDC en Base (puedes onramp desde Coinbase)</li>
          <li>Envía exactamente <strong>{artwork.priceUsd} USDC</strong> a la dirección de arriba</li>
          <li>Pega el hash de tu transacción abajo y haz clic en Verificar</li>
        </ol>
      </div>
    </div>
  );
}

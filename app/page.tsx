import Image from "next/image";
import Link from "next/link";
import { artworks, artist, formatClp } from "@/lib/artworks";

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="container-wide pt-20 pb-16">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">
            Original Oil Paintings · Chile
          </p>
          <h1 className="font-display text-5xl md:text-7xl mt-4 leading-[1.05]">
            maarmapa<span className="text-[var(--color-accent)]">.</span>
          </h1>
          <p className="mt-6 text-lg text-[var(--color-muted)] leading-relaxed">
            {artist.bio}
          </p>
          <p className="mt-4 text-sm text-[var(--color-muted)]">
            <span className="font-mono">{artist.ens}</span> ·{" "}
            <a
              href={`mailto:${artist.email}`}
              className="underline hover:text-[var(--color-gold)]"
            >
              {artist.email}
            </a>
          </p>
        </div>
      </section>

      {/* GRILLA DE OBRAS */}
      <section className="container-wide pb-24">
        <div className="flex items-baseline justify-between mb-10 border-b border-black/10 pb-4">
          <h2 className="font-display text-3xl">Obras disponibles</h2>
          <p className="text-sm text-[var(--color-muted)]">
            {artworks.filter((a) => a.status === "available").length} piezas
          </p>
        </div>

        <div className="grid gap-x-8 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
          {artworks.map((art) => (
            <Link
              key={art.slug}
              href={`/obra/${art.slug}`}
              className="group block"
            >
              <div className="relative aspect-[3/4] bg-white overflow-hidden border border-black/5">
                <Image
                  src={art.image}
                  alt={art.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {art.status !== "available" && (
                  <span className="absolute top-3 right-3 bg-black text-white text-xs px-3 py-1 uppercase tracking-wider">
                    {art.status === "sold" ? "Vendida" : "Reservada"}
                  </span>
                )}
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <h3 className="font-display text-xl group-hover:text-[var(--color-gold)] transition-colors">
                  {art.title}
                </h3>
                <p className="text-sm text-[var(--color-muted)]">{art.year}</p>
              </div>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {art.technique} · {art.dimensions}
              </p>
              <p className="mt-2 text-base font-medium">
                {formatClp(art.priceClp)}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA pagos */}
      <section className="bg-black text-[var(--color-canvas)] py-16">
        <div className="container-narrow text-center">
          <h2 className="font-display text-3xl md:text-4xl">
            Tres formas de comprar
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3 text-sm">
            <div>
              <p className="text-2xl">🇨🇱</p>
              <p className="font-medium mt-2">Mercado Pago</p>
              <p className="text-white/70 mt-1">
                Tarjetas, débito o cuotas. Compradores en Chile.
              </p>
            </div>
            <div>
              <p className="text-2xl">🏦</p>
              <p className="font-medium mt-2">Khipu</p>
              <p className="text-white/70 mt-1">
                Transferencia directa desde banco chileno.
              </p>
            </div>
            <div>
              <p className="text-2xl">⚡</p>
              <p className="font-medium mt-2">USDC (x402)</p>
              <p className="text-white/70 mt-1">
                Crypto en Base. Compradores internacionales.
              </p>
            </div>
          </div>
          <p className="mt-8 text-xs text-white/50">
            Para obras de gran formato (sobre 10M CLP) se recomienda
            contactar primero por email.
          </p>
        </div>
      </section>
    </>
  );
}

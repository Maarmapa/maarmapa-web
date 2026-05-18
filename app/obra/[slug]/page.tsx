import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  artworks,
  getArtwork,
  formatClp,
  formatUsd,
  artist,
} from "@/lib/artworks";
import { PaymentOptions } from "./PaymentOptions";

export function generateStaticParams() {
  return artworks.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const art = getArtwork(slug);
  if (!art) return { title: "Obra no encontrada" };
  return {
    title: art.title,
    description: art.description,
    openGraph: {
      title: `${art.title} — maarmapa`,
      description: art.description,
      images: [art.image],
    },
  };
}

export default async function ArtworkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const art = getArtwork(slug);
  if (!art) notFound();

  return (
    <article className="container-wide pt-12 pb-24">
      <Link
        href="/"
        className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]"
      >
        ← Volver a obras
      </Link>

      <div className="mt-8 grid gap-12 lg:grid-cols-[3fr_2fr]">
        {/* Imagen */}
        <div className="relative aspect-[3/4] bg-white border border-black/5">
          <Image
            src={art.image}
            alt={art.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-contain"
          />
        </div>

        {/* Info + pagos */}
        <div className="flex flex-col">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">
            {art.edition}
          </p>
          <h1 className="font-display text-4xl md:text-5xl mt-2 leading-tight">
            {art.title}
          </h1>
          <p className="mt-2 text-[var(--color-muted)]">
            por {artist.name} · {art.year}
          </p>

          <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-[var(--color-muted)]">Técnica</dt>
            <dd>{art.technique}</dd>
            <dt className="text-[var(--color-muted)]">Dimensiones</dt>
            <dd>{art.dimensions}</dd>
            <dt className="text-[var(--color-muted)]">Año</dt>
            <dd>{art.year}</dd>
            <dt className="text-[var(--color-muted)]">Firma</dt>
            <dd>{art.signed}</dd>
          </dl>

          <p className="mt-8 leading-relaxed text-[var(--color-muted)]">
            {art.description}
          </p>

          <div className="mt-10 pt-8 border-t border-black/10">
            <div className="flex items-baseline gap-3">
              <p className="text-3xl font-display">{formatClp(art.priceClp)}</p>
              <p className="text-sm text-[var(--color-muted)]">
                / {formatUsd(art.priceUsd)} USD
              </p>
            </div>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              Incluye certificado de autenticidad. Envío internacional con
              seguro (cotizado aparte).
            </p>

            <PaymentOptions artwork={art} />
          </div>
        </div>
      </div>
    </article>
  );
}

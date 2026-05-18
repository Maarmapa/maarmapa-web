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
    title: art.title.toLowerCase(),
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

  const idx = artworks.findIndex((a) => a.slug === slug);
  const num = String(idx + 1).padStart(3, "0");
  const statusClass =
    art.status === "available"
      ? "s-av"
      : art.status === "sold"
        ? "s-so"
        : "s-re";
  const statusLabel =
    art.status === "available"
      ? "available"
      : art.status === "sold"
        ? "sold"
        : "reserved";

  return (
    <article className="pt-8 pb-16">
      {/* Breadcrumb */}
      <Link
        href="/"
        className="font-mono text-[10px] text-[var(--color-dim)] tracking-wider lowercase hover:text-[var(--color-green)] transition-colors"
      >
        ← back to catalog
      </Link>

      {/* Header */}
      <div className="border-b border-[var(--color-gray)] pb-6 mt-6">
        <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
          <span className="font-mono text-[10px] text-[var(--color-dim)] tracking-wider">
            {num} / {art.title}
          </span>
          <span className={`entry-status ${statusClass}`}>{statusLabel}</span>
        </div>
        <h1 className="font-display text-[clamp(32px,9vw,56px)] font-black tracking-[-0.03em] text-[var(--color-white)] leading-[0.92] mb-3">
          {art.title}
        </h1>
        <p className="font-mono text-[11px] text-[var(--color-dim)] tracking-wide">
          by {artist.name} · {art.technique.toLowerCase()} ·{" "}
          <span className="text-[var(--color-green)]">{art.year}</span>
        </p>
      </div>

      {/* Image */}
      <div className="relative my-6 bg-[var(--color-black)] overflow-hidden">
        <Image
          src={art.image}
          alt={art.title}
          width={1200}
          height={1500}
          sizes="(max-width: 680px) 100vw, 640px"
          className="w-full block"
          style={{ filter: "brightness(.9) contrast(1.05)" }}
          priority
        />
      </div>

      {/* Specs */}
      <div className="border border-[var(--color-gray)] divide-y divide-[var(--color-gray)] mb-8">
        <div className="grid grid-cols-[120px_1fr] items-baseline p-3.5">
          <dt className="font-mono text-[10px] text-[var(--color-dim)] uppercase tracking-wider">
            technique
          </dt>
          <dd className="font-mono text-xs text-[var(--color-white)]">
            {art.technique}
          </dd>
        </div>
        <div className="grid grid-cols-[120px_1fr] items-baseline p-3.5">
          <dt className="font-mono text-[10px] text-[var(--color-dim)] uppercase tracking-wider">
            dimensions
          </dt>
          <dd className="font-mono text-xs text-[var(--color-white)]">
            {art.dimensions}
          </dd>
        </div>
        <div className="grid grid-cols-[120px_1fr] items-baseline p-3.5">
          <dt className="font-mono text-[10px] text-[var(--color-dim)] uppercase tracking-wider">
            year
          </dt>
          <dd className="font-mono text-xs text-[var(--color-green)]">
            {art.year}
          </dd>
        </div>
        <div className="grid grid-cols-[120px_1fr] items-baseline p-3.5">
          <dt className="font-mono text-[10px] text-[var(--color-dim)] uppercase tracking-wider">
            edition
          </dt>
          <dd className="font-mono text-xs text-[var(--color-white)]">
            {art.edition}
          </dd>
        </div>
        <div className="grid grid-cols-[120px_1fr] items-baseline p-3.5">
          <dt className="font-mono text-[10px] text-[var(--color-dim)] uppercase tracking-wider">
            signed
          </dt>
          <dd className="font-mono text-xs text-[var(--color-aaa)] leading-relaxed">
            {art.signed}
          </dd>
        </div>
      </div>

      {/* Description */}
      <p className="font-mono text-xs text-[var(--color-aaa)] leading-[1.8] mb-10 max-w-[560px]">
        {art.description}
      </p>

      {/* Price block */}
      <div className="border-t-2 border-[var(--color-white)] pt-6 mb-6">
        <div className="font-mono text-[9px] font-bold text-[var(--color-dim)] tracking-[0.2em] uppercase mb-3">
          ── price
        </div>
        <div className="flex items-baseline gap-3 flex-wrap">
          <p className="font-display text-4xl md:text-5xl font-black text-[var(--color-white)] tracking-[-0.02em]">
            {formatClp(art.priceClp)}
          </p>
          <p className="font-mono text-[11px] text-[var(--color-dim)]">
            / {formatUsd(art.priceUsd)} usd /{" "}
            <span className="text-[var(--color-pink)]">{art.priceUsd} usdc</span>
          </p>
        </div>
        <p className="mt-2 font-mono text-[10px] text-[var(--color-dim)] tracking-wide">
          incluye certificado de autenticidad · envío internacional cotizado aparte
        </p>
      </div>

      <PaymentOptions artwork={art} />
    </article>
  );
}

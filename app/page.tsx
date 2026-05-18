import Image from "next/image";
import Link from "next/link";
import { artworks, formatClp } from "@/lib/artworks";

export default function HomePage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      {/* ── SITE HEADER ── */}
      <section className="border-b-2 border-[var(--color-white)] pt-12 pb-8">
        <div className="font-mono text-[10px] font-normal text-[var(--color-dim)] tracking-[0.12em] uppercase mb-4">
          painter / chile /{" "}
          <span className="text-[var(--color-green)]">{today}</span>
        </div>
        <h1 className="font-display text-[clamp(56px,14vw,96px)] font-black tracking-[-0.04em] leading-[0.88] text-[var(--color-white)] mb-5">
          maar
          <span className="block text-[var(--color-pink)]">mapa</span>
          <span className="block text-[var(--color-green)]">.</span>
        </h1>
        <p className="font-mono text-[11px] text-[var(--color-dim)] max-w-[480px] leading-[1.75] tracking-wide mb-6">
          Obra original sobre lienzo. Arte contemporáneo chileno. Cada
          pieza, única — firmada, certificada, irrepetible.
        </p>
        <div className="flex flex-wrap gap-1.5 mb-7">
          <span className="tag t-pink">paintings</span>
          <span className="tag t-green">available now</span>
          <span className="tag">oil · acrylic</span>
          <span className="tag">chile / worldwide</span>
        </div>
        <div className="flex gap-0 flex-wrap">
          <a href="#obras" className="btn-p">
            view works
          </a>
          <a href="/sobre" className="btn-g">
            about ↗
          </a>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="divider">↓ catalog / 7 pieces available</div>

      {/* ── ENTRIES (PAINTINGS) ── */}
      <section id="obras">
        {artworks.map((art, idx) => {
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
            <article
              key={art.slug}
              className="border-b border-[var(--color-gray)] py-9 hover:bg-white/[0.015] transition-colors"
            >
              <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
                <span className="font-mono text-[10px] text-[var(--color-dim)] tracking-wider">
                  {num} / {art.title}
                </span>
                <span className={`entry-status ${statusClass}`}>
                  {statusLabel}
                </span>
              </div>

              <Link
                href={`/obra/${art.slug}`}
                className="block w-full mb-5 overflow-hidden relative cursor-pointer group bg-[var(--color-black)]"
              >
                <Image
                  src={art.image}
                  alt={art.title}
                  width={1200}
                  height={1500}
                  sizes="(max-width: 680px) 100vw, 640px"
                  className="w-full block transition-all duration-300 group-hover:scale-[1.01]"
                  style={{
                    filter: "brightness(.85) contrast(1.05)",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent from-60% to-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="font-mono text-[10px] tracking-wider uppercase text-white/60">
                    → view details / buy
                  </span>
                </div>
              </Link>

              <Link href={`/obra/${art.slug}`}>
                <h2 className="font-display text-[clamp(22px,6vw,32px)] font-black tracking-[-0.02em] text-[var(--color-white)] mb-1.5 leading-[1.05] cursor-pointer hover:text-[var(--color-pink)] transition-colors">
                  {art.title}
                </h2>
              </Link>

              <p className="font-mono text-[10px] text-[var(--color-dim)] mb-3.5 tracking-wide">
                {art.technique.toLowerCase()} · original ·{" "}
                <span className="text-[var(--color-green)]">{art.year}</span>
              </p>

              <p className="font-mono text-xs text-[var(--color-aaa)] leading-[1.8] mb-5 max-w-[560px]">
                {art.description}
              </p>

              <div className="flex justify-between items-center flex-wrap gap-2.5">
                {art.status === "available" ? (
                  <span className="font-display text-lg font-black text-[var(--color-white)] tracking-[-0.01em]">
                    {formatClp(art.priceClp)}
                  </span>
                ) : (
                  <span className="font-mono text-xs text-[var(--color-dim)] tracking-wider uppercase">
                    {art.status === "sold" ? "no longer available" : "reserved"}
                  </span>
                )}
                <Link
                  href={`/obra/${art.slug}`}
                  className={
                    art.status === "available"
                      ? "font-mono text-[10px] font-bold tracking-wider uppercase px-4.5 py-2 bg-[var(--color-white)] text-[var(--color-black)] transition-all hover:bg-transparent hover:border hover:border-[var(--color-pink)] hover:text-[var(--color-pink)] border border-transparent"
                      : "font-mono text-[10px] font-bold tracking-wider uppercase px-4.5 py-2 bg-transparent border border-[var(--color-gray)] text-[var(--color-dim)] pointer-events-none"
                  }
                  style={{ padding: "8px 18px" }}
                >
                  {art.status === "available" ? "buy / inquire ↗" : "sold"}
                </Link>
              </div>
            </article>
          );
        })}
      </section>

      {/* ── TERMINAL BLOCK ── */}
      <div className="terminal">
        <div className="terminal-header">
          <span className="t-dot t-red"></span>
          <span className="t-dot t-yellow"></span>
          <span className="t-dot t-green-dot"></span>
          <span className="t-title">~/maarmapa — payment.config</span>
        </div>
        <div className="terminal-body">
          <div className="t-line">
            <span className="prompt">$</span>{" "}
            <span className="cmd">list payment_methods</span>
          </div>
          <div className="t-line">
            <span className="out">→ mercadopago (cl) · cards · cuotas</span>
          </div>
          <div className="t-line">
            <span className="out">→ khipu (cl) · bank transfer</span>
          </div>
          <div className="t-line">
            <span className="pink-out">→ x402 · usdc on base · web3 ✦</span>
          </div>
          <div className="t-line">
            <span className="out">→ email · for inquiries +10M clp</span>
          </div>
          <div className="t-line">
            <span className="prompt">$</span>
            <span className="t-cursor"></span>
          </div>
        </div>
      </div>
    </>
  );
}

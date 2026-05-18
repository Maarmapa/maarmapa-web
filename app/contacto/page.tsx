import { artist } from "@/lib/artworks";

export const metadata = { title: "contact" };

export default function ContactPage() {
  return (
    <div className="pt-12 pb-16">
      <div className="font-mono text-[9px] font-bold text-[var(--color-green)] tracking-[0.3em] uppercase mb-4">
        ── contact
      </div>
      <h1 className="font-display text-[clamp(40px,11vw,72px)] font-black tracking-[-0.03em] leading-[0.92] mb-6">
        let&apos;s
        <span className="block text-[var(--color-pink)]">talk.</span>
      </h1>
      <p className="font-mono text-xs text-[var(--color-aaa)] leading-[1.8] mb-10 max-w-[480px]">
        Para consultas sobre obras, comisiones, exhibiciones o
        colaboraciones, escríbeme directamente. Respondo personalmente
        cada mensaje.
      </p>

      <div className="space-y-1">
        <a
          href={`mailto:${artist.email}`}
          className="block p-5 border border-[var(--color-gray)] transition-all hover:border-[var(--color-pink)] hover:bg-white/[0.02] group"
        >
          <p className="font-mono text-[9px] text-[var(--color-dim)] tracking-[0.2em] uppercase mb-1 group-hover:text-[var(--color-pink)] transition-colors">
            → email
          </p>
          <p className="font-display text-xl font-black text-[var(--color-white)] tracking-[-0.01em]">
            {artist.email}
          </p>
        </a>

        <a
          href={`https://instagram.com/${artist.instagram.replace("@", "")}`}
          className="block p-5 border border-[var(--color-gray)] transition-all hover:border-[var(--color-green)] hover:bg-white/[0.02] group"
        >
          <p className="font-mono text-[9px] text-[var(--color-dim)] tracking-[0.2em] uppercase mb-1 group-hover:text-[var(--color-green)] transition-colors">
            → instagram
          </p>
          <p className="font-display text-xl font-black text-[var(--color-white)] tracking-[-0.01em]">
            {artist.instagram}
          </p>
        </a>

        <a
          href="https://etherscan.io/enslookup-search?search=maarmapa.eth"
          className="block p-5 border border-[var(--color-gray)] transition-all hover:border-[var(--color-pink)] hover:bg-white/[0.02] group"
        >
          <p className="font-mono text-[9px] text-[var(--color-dim)] tracking-[0.2em] uppercase mb-1 group-hover:text-[var(--color-pink)] transition-colors">
            → web3
          </p>
          <p className="font-mono text-base text-[var(--color-white)]">
            {artist.ens}
          </p>
        </a>
      </div>
    </div>
  );
}

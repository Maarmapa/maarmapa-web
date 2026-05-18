import { artist } from "@/lib/artworks";

export const metadata = {
  title: "about",
  description: "Mario Maldonado Parra. Artista contemporáneo chileno.",
};

export default function AboutPage() {
  return (
    <article className="pt-12 pb-16">
      <div className="font-mono text-[9px] font-bold text-[var(--color-dim)] tracking-[0.3em] uppercase mb-4">
        ── about
      </div>

      <h1 className="font-display text-[clamp(40px,11vw,72px)] font-black tracking-[-0.03em] leading-[0.92] mb-3">
        {artist.fullName.split(" ").map((word, i, arr) => {
          const accent =
            i === arr.length - 1
              ? "text-[var(--color-pink)]"
              : i === 0
                ? "text-[var(--color-white)]"
                : "text-[var(--color-white)]";
          return (
            <span key={i} className={`${accent} block md:inline`}>
              {word}{" "}
            </span>
          );
        })}
      </h1>
      <p className="font-mono text-[11px] text-[var(--color-dim)] tracking-wide mb-10">
        aka{" "}
        <span className="text-[var(--color-green)]">{artist.name}</span> ·{" "}
        based in {artist.city.toLowerCase()}
      </p>

      <div className="space-y-4 font-mono text-xs text-[var(--color-aaa)] leading-[1.8] max-w-[560px]">
        <p>{artist.bio}</p>
        <p>
          Mi trabajo cruza cultura pop, graffiti, pintura al óleo clásica
          y memoria urbana. Cada obra es única, firmada y documentada con
          certificado de autenticidad.
        </p>
        <p>
          Esta galería opera sin intermediarios: las obras se venden
          directamente desde mi estudio, con envío internacional
          asegurado.
        </p>
      </div>

      {/* Stats / facts */}
      <div className="mt-12 border-t-2 border-[var(--color-white)] pt-6">
        <div className="font-mono text-[9px] font-bold text-[var(--color-dim)] tracking-[0.3em] uppercase mb-4">
          ── stats
        </div>
        <div className="border border-[var(--color-gray)] divide-y divide-[var(--color-gray)]">
          <div className="grid grid-cols-[120px_1fr] p-3.5">
            <dt className="font-mono text-[10px] text-[var(--color-dim)] uppercase tracking-wider">
              email
            </dt>
            <dd>
              <a
                href={`mailto:${artist.email}`}
                className="font-mono text-xs text-[var(--color-white)] hover:text-[var(--color-green)] transition-colors"
              >
                {artist.email}
              </a>
            </dd>
          </div>
          <div className="grid grid-cols-[120px_1fr] p-3.5">
            <dt className="font-mono text-[10px] text-[var(--color-dim)] uppercase tracking-wider">
              instagram
            </dt>
            <dd>
              <a
                href={`https://instagram.com/${artist.instagram.replace("@", "")}`}
                className="font-mono text-xs text-[var(--color-white)] hover:text-[var(--color-green)] transition-colors"
              >
                {artist.instagram}
              </a>
            </dd>
          </div>
          <div className="grid grid-cols-[120px_1fr] p-3.5">
            <dt className="font-mono text-[10px] text-[var(--color-dim)] uppercase tracking-wider">
              ens
            </dt>
            <dd>
              <code className="font-mono text-xs text-[var(--color-pink)]">
                {artist.ens}
              </code>
            </dd>
          </div>
          <div className="grid grid-cols-[120px_1fr] p-3.5">
            <dt className="font-mono text-[10px] text-[var(--color-dim)] uppercase tracking-wider">
              city
            </dt>
            <dd className="font-mono text-xs text-[var(--color-aaa)]">
              {artist.city}
            </dd>
          </div>
        </div>
      </div>
    </article>
  );
}

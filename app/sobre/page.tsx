import { artist } from "@/lib/artworks";

export const metadata = {
  title: "Sobre maarmapa",
  description: "Artista chileno contemporáneo. Pintura al óleo, arte urbano.",
};

export default function AboutPage() {
  return (
    <article className="container-narrow py-20">
      <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">
        Sobre
      </p>
      <h1 className="font-display text-5xl mt-3">{artist.fullName}</h1>
      <p className="mt-2 text-[var(--color-muted)]">aka {artist.name}</p>

      <div className="mt-10 prose prose-lg max-w-none text-[var(--color-muted)] leading-relaxed space-y-4">
        <p>{artist.bio}</p>
        <p>
          Mi trabajo cruza la cultura pop, el graffiti, la pintura al óleo
          clásica y la memoria urbana. Cada obra es única, firmada y
          documentada con certificado de autenticidad.
        </p>
        <p>
          Esta galería opera sin intermediarios: las obras se venden
          directamente desde mi estudio, con envío internacional asegurado.
        </p>
      </div>

      <div className="mt-12 pt-8 border-t border-black/10 grid gap-4 sm:grid-cols-2 text-sm">
        <div>
          <p className="text-[var(--color-muted)]">Email</p>
          <a
            href={`mailto:${artist.email}`}
            className="underline hover:text-[var(--color-gold)]"
          >
            {artist.email}
          </a>
        </div>
        <div>
          <p className="text-[var(--color-muted)]">Instagram</p>
          <a
            href={`https://instagram.com/${artist.instagram.replace("@", "")}`}
            className="underline hover:text-[var(--color-gold)]"
          >
            {artist.instagram}
          </a>
        </div>
        <div>
          <p className="text-[var(--color-muted)]">ENS</p>
          <code>{artist.ens}</code>
        </div>
        <div>
          <p className="text-[var(--color-muted)]">Ciudad</p>
          <p>{artist.city}</p>
        </div>
      </div>
    </article>
  );
}

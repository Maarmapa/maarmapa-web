import { artist } from "@/lib/artworks";

export const metadata = { title: "Contacto" };

export default function ContactPage() {
  return (
    <div className="container-narrow py-20">
      <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">
        Contacto
      </p>
      <h1 className="font-display text-5xl mt-3">Hablemos.</h1>
      <p className="mt-6 text-lg text-[var(--color-muted)] leading-relaxed">
        Para consultas sobre obras, comisiones, exhibiciones o colaboraciones,
        escríbeme directamente. Respondo personalmente cada mensaje.
      </p>

      <div className="mt-12 space-y-4">
        <a
          href={`mailto:${artist.email}`}
          className="block p-6 border border-black/10 hover:border-black hover:bg-black hover:text-white transition"
        >
          <p className="text-sm text-[var(--color-muted)] group-hover:text-white/70">
            Email
          </p>
          <p className="text-xl font-display mt-1">{artist.email}</p>
        </a>

        <a
          href={`https://instagram.com/${artist.instagram.replace("@", "")}`}
          className="block p-6 border border-black/10 hover:border-black hover:bg-black hover:text-white transition"
        >
          <p className="text-sm text-[var(--color-muted)]">Instagram</p>
          <p className="text-xl font-display mt-1">{artist.instagram}</p>
        </a>
      </div>
    </div>
  );
}

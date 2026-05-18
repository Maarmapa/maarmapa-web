import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "maarmapa — original paintings",
    template: "%s · maarmapa",
  },
  description:
    "Obra original sobre lienzo. Arte contemporáneo chileno. Cada pieza, única — firmada, certificada, irrepetible.",
  metadataBase: new URL("https://maarmapa.eth.limo"),
  openGraph: {
    title: "maarmapa — original paintings",
    description:
      "Obra original sobre lienzo. Arte contemporáneo chileno.",
    url: "https://maarmapa.eth.limo",
    siteName: "maarmapa",
    locale: "es_CL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-CL">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;900&family=IBM+Plex+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* ── NAV ── */}
        <nav className="sticky top-0 z-[100] bg-[var(--color-black)] border-b border-[var(--color-gray)] py-3 -mx-5 px-5 flex justify-between items-center">
          <a
            href="/"
            className="font-mono text-sm font-bold text-[var(--color-white)] tracking-[-0.01em]"
          >
            maar<span className="text-[var(--color-pink)]">ma</span>
            <span className="text-[var(--color-green)]">pa</span>
          </a>
          <div className="flex gap-5 items-center">
            <a
              href="/sobre"
              className="font-mono text-[11px] text-[var(--color-dim)] tracking-wider lowercase transition-colors hover:text-[var(--color-green)]"
            >
              about
            </a>
            <a
              href="/contacto"
              className="font-mono text-[11px] text-[var(--color-dim)] tracking-wider lowercase transition-colors hover:text-[var(--color-green)]"
            >
              contact
            </a>
            <a
              href="/#obras"
              className="font-mono text-[11px] font-bold text-[var(--color-pink)] border border-[var(--color-pink)] px-2.5 py-1 lowercase transition-all hover:bg-[var(--color-pink)] hover:text-[var(--color-black)]"
            >
              shop ↗
            </a>
          </div>
        </nav>

        <main>{children}</main>

        {/* ── FOOTER ── */}
        <footer className="py-7 pb-10 flex justify-between items-start flex-wrap gap-4 mt-12">
          <div className="font-mono text-xs font-bold text-[var(--color-dim)]">
            maar<span className="text-[var(--color-pink)]">mapa</span>
          </div>
          <div className="flex flex-col gap-1.5 text-right">
            <a
              href="mailto:mario@boykot.cl"
              className="font-mono text-[10px] text-[#444] tracking-wider transition-colors hover:text-[var(--color-white)]"
            >
              mario@boykot.cl
            </a>
            <a
              href="https://instagram.com/maarmapa"
              className="font-mono text-[10px] text-[#444] tracking-wider transition-colors hover:text-[var(--color-white)]"
            >
              instagram ↗
            </a>
            <code className="font-mono text-[10px] text-[#444] tracking-wider">
              maarmapa.eth
            </code>
          </div>
          <div className="w-full font-mono text-[9px] text-[#333] tracking-wider pt-4 border-t border-[#1a1a1a]">
            © {new Date().getFullYear()} maarmapa — all works © mario maldonado parra
          </div>
        </footer>
      </body>
    </html>
  );
}

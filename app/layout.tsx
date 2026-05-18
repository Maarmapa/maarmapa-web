import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "maarmapa — Original Oil Paintings by Chilean Artist",
    template: "%s · maarmapa",
  },
  description:
    "Galería personal de obras originales del artista chileno maarmapa. Pinturas al óleo, acrílico, arte contemporáneo. Envíos a Chile y al mundo.",
  metadataBase: new URL("https://maarmapa.eth.limo"),
  openGraph: {
    title: "maarmapa — Original Oil Paintings",
    description:
      "Galería personal de obras originales del artista chileno maarmapa.",
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
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="border-b border-black/10">
          <nav className="container-wide flex items-center justify-between py-6">
            <a href="/" className="text-xl font-display tracking-wide">
              maarmapa<span className="text-[var(--color-accent)]">.</span>
            </a>
            <ul className="hidden md:flex gap-8 text-sm">
              <li><a href="/" className="hover:text-[var(--color-gold)]">Obras</a></li>
              <li><a href="/sobre" className="hover:text-[var(--color-gold)]">Sobre</a></li>
              <li><a href="/contacto" className="hover:text-[var(--color-gold)]">Contacto</a></li>
            </ul>
          </nav>
        </header>

        <main>{children}</main>

        <footer className="border-t border-black/10 mt-24">
          <div className="container-wide py-10 grid gap-6 md:grid-cols-3 text-sm text-[var(--color-muted)]">
            <div>
              <p className="font-display text-lg text-[var(--color-ink)]">
                maarmapa
              </p>
              <p className="mt-2">Original oil paintings · Chile</p>
            </div>
            <div>
              <p className="font-medium text-[var(--color-ink)]">Contacto</p>
              <p className="mt-2">
                <a href="mailto:mario@boykot.cl" className="hover:underline">
                  mario@boykot.cl
                </a>
              </p>
              <p>
                <a
                  href="https://instagram.com/maarmapa"
                  className="hover:underline"
                >
                  @maarmapa en Instagram
                </a>
              </p>
            </div>
            <div>
              <p className="font-medium text-[var(--color-ink)]">Pagos</p>
              <p className="mt-2">Mercado Pago · Khipu · USDC (x402)</p>
              <p className="mt-1 text-xs">
                ENS: <code>maarmapa.eth</code>
              </p>
            </div>
          </div>
          <div className="container-wide pb-6 text-xs text-[var(--color-muted)]">
            © {new Date().getFullYear()} maarmapa — All works © Mario
            Maldonado Parra
          </div>
        </footer>
      </body>
    </html>
  );
}

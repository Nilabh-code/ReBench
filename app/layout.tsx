import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import Nav from "../components/Nav";
import { allRecords } from "../lib/data";
import Footer from "../components/Footer";
import Reveal from "../components/Reveal";
import "./globals.css";

const grotesk = Archivo({
  subsets: ["latin"],
  variable: "--font-grotesk",
  axes: ["wdth"],
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  fallback: ["SFMono-Regular", "Menlo", "monospace"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nilabh-code.github.io/ReBench/"),
  title: {
    default: "ReBench — Open, reproducible AI benchmarks",
    template: "%s — ReBench",
  },
  description:
    "AI benchmarks shouldn't be trusted. They should be reproduced. ReBench is an open database of measured inference runs — every number traces to a machine, a revision and a commit.",
  icons: { icon: "/ReBench/favicon.svg" },
  alternates: { canonical: "/" },
  openGraph: {
    title: "ReBench — Open, reproducible AI benchmarks",
    description:
      "AI benchmarks shouldn't be trusted. They should be reproduced.",
    type: "website",
    url: "/",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "ReBench — open, reproducible AI benchmarks" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ReBench — Open, reproducible AI benchmarks",
    description:
      "AI benchmarks shouldn't be trusted. They should be reproduced.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "ReBench — open, reproducible AI benchmarks" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1ede2" },
    { media: "(prefers-color-scheme: dark)", color: "#141210" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${grotesk.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col antialiased">
        <script dangerouslySetInnerHTML={{ __html: `document.documentElement.classList.add('js')` }} />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("rebench-theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme="light";}})();`,
          }}
        />
        <a href="#main-content" className="skip-link">
          SKIP TO CONTENT
        </a>
        <Reveal />
        <Nav runs={allRecords().length} />
        <main id="main-content" className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

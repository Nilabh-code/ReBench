import type { Metadata } from "next";
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
  metadataBase: new URL("https://rebench.netlify.app"),
  title: {
    default: "ReBench — Open, reproducible AI benchmarks",
    template: "%s — ReBench",
  },
  description:
    "AI benchmarks shouldn't be trusted. They should be reproduced. ReBench is an open benchmark database built from independently reproduced runs, transparent configurations and publicly auditable results.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "ReBench — Open, reproducible AI benchmarks",
    description:
      "AI benchmarks shouldn't be trusted. They should be reproduced.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${grotesk.variable} ${mono.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        <script dangerouslySetInnerHTML={{ __html: `document.documentElement.classList.add('js')` }} />
        <Reveal />
        <Nav runs={allRecords().length} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

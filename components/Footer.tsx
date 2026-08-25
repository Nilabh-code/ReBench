import Link from "next/link";
import { BUILD_HASH, DISCORD_URL, REPO_URL, referenceRecord } from "../lib/data";

export default function Footer() {
  const reference = referenceRecord();
  const cols = [
    {
      head: "INDEX",
      links: [
        { label: "GitHub ↗", href: REPO_URL, external: true },
        { label: "Discord ↗", href: DISCORD_URL, external: true },
        { label: "Benchmarks", href: "/benchmarks" },
        { label: "Models", href: "/models" },
        { label: "Methodology", href: "/methodology" },
        { label: "Contributors", href: "/contributors" },
      ],
    },
    {
      head: "RECORDS",
      links: [
        { label: "Result schema ↗", href: `${REPO_URL}/blob/main/schema/benchmark.schema.json`, external: true },
        { label: "Run index ↗", href: `${REPO_URL}/blob/main/data/benchmarks.json`, external: true },
        ...(reference ? [{ label: "Reference run", href: `/runs/${reference.id}`, external: false }] : []),
      ],
    },
  ];

  return (
    <footer className="border-t border-ink/25 bg-paper-dim">
      <div className="mx-auto w-full max-w-page px-6 py-12 md:px-10">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="mono text-sm font-semibold tracking-[0.24em]">REBENCH</p>
            <p className="mt-3 max-w-[36ch] text-sm leading-relaxed text-graphite">
              Open, reproducible AI benchmarks.
            </p>
            <p className="mono mt-4 text-[0.625rem] tracking-[0.16em] text-stone">
              EVERY NUMBER → A RUN. EVERY RUN → A COMMIT.
            </p>
          </div>
          {cols.map((col) => (
            <nav key={col.head} aria-label={`Footer — ${col.head}`}>
              <p className="mono text-[0.625rem] tracking-[0.22em] text-stone">{col.head}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.external ? (
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-graphite hover:text-accent"
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href} className="text-sm text-graphite hover:text-accent">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mono mt-12 flex flex-col gap-2 border-t border-ink/20 pt-5 text-[0.625rem] tracking-[0.16em] text-stone sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 REBENCH CONTRIBUTORS · MIT LICENSE</span>
          <span>
            {BUILD_HASH ? (
              <>BUILD <span className="text-ink">{BUILD_HASH}</span> · RUNNER v1.2.0</>
            ) : (
              <>RUNNER v1.2.0</>
            )}
          </span>
          <span className="text-accent">CURRENT INDEX: MEASURED DATA</span>
        </div>
      </div>
    </footer>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { allRecords, REPO_URL } from "../lib/data";

const LINKS = [
  { href: "/benchmarks", label: "BENCHMARKS", idx: "01" },
  { href: "/models", label: "MODELS", idx: "02" },
  { href: "/methodology", label: "METHODOLOGY", idx: "03" },
  { href: "/contributors", label: "CONTRIBUTORS", idx: "04" },
];

function UtcClock() {
  const [now, setNow] = useState<string>("--:--:--");
  useEffect(() => {
    const tick = () => setNow(new Date().toISOString().slice(11, 19));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="clip-numeric">{now} UTC</span>;
}

function Wordmark() {
  return (
    <Link href="/" className="group flex items-center gap-2.5">
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden className="shrink-0">
        <rect x="1" y="1" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M11 1v4M11 17v4M1 11h4M17 11h4" stroke="currentColor" strokeWidth="1" />
        <rect x="7" y="7" width="8" height="8" fill="#D53A0C" className="transition-transform duration-300 group-hover:rotate-90" style={{ transformOrigin: "11px 11px" }} />
      </svg>
      <span className="mono text-sm font-semibold tracking-[0.24em]">
        REBENCH
        <span className="blink text-accent">▮</span>
      </span>
    </Link>
  );
}

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const runs = allRecords().length;

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-ink/25 bg-paper">
      {/* status strip */}
      <div className="mono hidden border-b border-ink/15 bg-paper-dim text-[0.625rem] tracking-[0.16em] text-graphite sm:flex">
        <div className="mx-auto flex w-full max-w-page items-center justify-between px-6 py-[5px] md:px-10">
          <span className="flex items-center gap-2">
            <span className="dot bg-accent" />
            SYSTEM NOMINAL
          </span>
          <span className="hidden md:block">{runs} RUNS INDEXED · REV 2026-08-24</span>
          <span className="flex items-center gap-3">
            <span className="text-accent">DEMO DATA</span>
            <UtcClock />
          </span>
        </div>
      </div>

      {/* main bar */}
      <div className="mx-auto flex w-full max-w-page items-center justify-between gap-6 px-6 py-3 md:px-10">
        <Wordmark />
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          {LINKS.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`mono text-[0.6875rem] tracking-[0.18em] transition-colors hover:text-accent ${
                  active ? "text-ink underline decoration-accent decoration-2 underline-offset-8" : "text-graphite"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden items-center gap-5 lg:flex">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mono text-[0.6875rem] tracking-[0.18em] text-graphite hover:text-accent"
          >
            GITHUB ↗
          </a>
          <Link href="/methodology#run" className="btn btn-solid !px-4 !py-2">
            RUN
          </Link>
        </div>

        {/* mobile trigger */}
        <button
          className="mono flex items-center gap-2 border border-ink px-3 py-1.5 text-[0.6875rem] tracking-[0.18em] lg:hidden"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="Menu"
        >
          {open ? "CLOSE" : "MENU"}
        </button>
      </div>

      {/* mobile overlay */}
      {open ? (
        <div className="absolute left-0 right-0 top-full z-40 max-h-[calc(100vh-52px)] overflow-y-auto border-b border-ink/25 bg-paper shadow-[0_8px_0_rgba(22,19,16,0.08)] lg:hidden">
          <div className="flex flex-col px-6 pb-10 pt-4">
            <nav className="flex flex-col" aria-label="Mobile">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex items-baseline gap-4 border-b border-ink/15 py-5"
                >
                  <span className="mono text-[0.625rem] text-stone">{l.idx}</span>
                  <span className="font-disp text-3xl font-semibold">{l.label}</span>
                </Link>
              ))}
            </nav>
            <div className="mt-8 flex flex-col gap-4">
              <Link href="/methodology#run" onClick={() => setOpen(false)} className="btn btn-solid justify-center">
                RUN A BENCHMARK
              </Link>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-line justify-center"
              >
                VIEW SOURCE ↗
              </a>
            </div>
            <p className="mono mt-8 pb-2 text-[0.625rem] tracking-[0.16em] text-stone">
              REBENCH v1.2.0 · DEMO DATA · MIT
            </p>
          </div>
        </div>
      ) : null}
    </header>
  );
}

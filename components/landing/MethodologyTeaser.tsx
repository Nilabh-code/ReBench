import Link from "next/link";
import { SectionHead } from "../ui";

const CLAUSES = [
  { n: "01", t: "HARDWARE", d: "Device, VRAM, RAM, CPU and driver are recorded from the machine itself — never typed by hand." },
  { n: "02", t: "MODEL", d: "Weights are pinned to an exact revision hash. Two runs of 'the same model' at different revisions are different runs." },
  { n: "03", t: "QUANTIZATION", d: "The quant format and its implementation are part of the record. Q4_K_M is not 'roughly Q4'." },
  { n: "04", t: "ENGINE", d: "Inference engine and version, build flags where available. The engine is half the benchmark." },
  { n: "05", t: "PROMPT", d: "Fixed prompt length, fixed generation length. The workload ships with the runner and cannot be edited per-run." },
  { n: "06", t: "GENERATION", d: "Sampling parameters are pinned; generation is measured token-by-token, warmup excluded." },
  { n: "07", t: "MEASUREMENT", d: "Prompt TPS, generation TPS and TTFT are reported separately. The composite index is a formula, in the open." },
  { n: "08", t: "VALIDATION", d: "A run is REPRODUCED when a second machine confirms it, VERIFIED when CI has checked schema, outliers and provenance." },
];

export default function MethodologyTeaser() {
  return (
    <section className="border-b border-ink/25 bg-paper-dim/50">
      <div className="mx-auto w-full max-w-page px-6 py-20 md:px-10 lg:py-24">
        <SectionHead no="SEC.08 / PROTOCOL" title="METHODOLOGY" note="DOCUMENT RB-M-001 · VERSION 1.2" />

        <div className="mt-12 grid gap-12 lg:grid-cols-[0.9fr_1.3fr]">
          <div data-reveal>
            <div className="border border-ink bg-paper p-7">
              <p className="mono text-[0.625rem] tracking-[0.26em] text-stone">REBENCH METHODOLOGY</p>
              <p className="font-disp mt-3 text-4xl font-extrabold">VERSION 1.2</p>
              <p className="mt-5 text-sm leading-relaxed text-graphite">
                Eight clauses, versioned like code. When the methodology
                changes, the benchmark version changes with it — and old
                numbers are never silently compared against new ones.
              </p>
              <Link href="/methodology" className="link-u mt-6 inline-block">
                READ THE FULL PROTOCOL →
              </Link>
            </div>
            <pre aria-hidden className="mono mt-4 hidden overflow-x-auto text-[0.5625rem] leading-[1.7] text-stone md:block">
{`  §07  score = 0.55·g + 0.30·p + 0.15·t
       g ← gen TPS vs reference curve
       p ← prompt TPS vs reference curve
       t ← ttft vs 2500 ms ceiling`}
            </pre>
          </div>

          <ol className="divide-y divide-ink/20 border-y border-ink/30">
            {CLAUSES.map((c, i) => (
              <li key={c.n} data-reveal style={{ "--reveal-delay": `${i * 60}ms` } as React.CSSProperties}>
                <Link href={`/methodology#${c.n}`} className="group flex items-baseline gap-5 py-4">
                  <span className="mono w-8 shrink-0 text-[0.6875rem] text-stone">{c.n}</span>
                  <span className="w-32 shrink-0 sm:w-40">
                    <span className="font-disp text-base font-bold tracking-tight sm:text-lg">{c.t}</span>
                  </span>
                  <span className="mono hidden flex-1 text-[0.625rem] leading-relaxed tracking-[0.06em] text-graphite sm:block">
                    {c.d}
                  </span>
                  <span aria-hidden className="mono ml-auto text-stone transition-transform group-hover:translate-x-1 group-hover:text-accent">→</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

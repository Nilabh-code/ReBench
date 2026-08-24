import CalibrationRig from "../CalibrationRig";
import InstrumentPanel from "../InstrumentPanel";
import { allRecords, referenceRecord, REPO_URL } from "../../lib/data";
import { asciiBar } from "../../lib/format";
import { CornerMarks, FigLabel } from "../ui";
import Link from "next/link";

function TopRunsAscii() {
  const top = [...allRecords()].sort((a, b) => b.generationTPS - a.generationTPS).slice(0, 3);
  if (!top.length) return null;
  const max = top[0].generationTPS;
  return (
    <div className="relative hidden max-w-[430px] border border-ink/30 bg-paper-dim/60 md:block" data-reveal style={{ "--reveal-delay": "400ms" } as React.CSSProperties}>
      <CornerMarks />
      <div className="flex items-center justify-between border-b border-ink/20 px-3 py-1.5">
        <span className="mono text-[0.5625rem] tracking-[0.24em] text-stone">TOP GENERATION // OBSERVED</span>
        <span className="mono text-[0.5625rem] tracking-[0.2em] text-accent">DEMO</span>
      </div>
      <pre className="mono overflow-x-auto px-3 py-2.5 text-[0.6875rem] leading-[1.65] text-graphite">
        {top
          .map((r) => {
            const label = r.model.replace(/\s+/g, "").toUpperCase();
            return `${label.padEnd(12)} ${asciiBar(r.generationTPS, max, 18)} ${String(r.generationTPS.toFixed(1)).padStart(6)}`;
          })
          .join("\n")}
      </pre>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="paper-grid relative overflow-hidden border-b border-ink/25">
      {/* axis annotations */}
      <div aria-hidden className="mono pointer-events-none absolute left-3 top-24 hidden text-[0.5625rem] tracking-[0.2em] text-stone/70 xl:block" style={{ writingMode: "vertical-rl" }}>
        AXIS Y — THROUGHPUT
      </div>
      <div aria-hidden className="mono pointer-events-none absolute bottom-3 right-6 hidden text-[0.5625rem] tracking-[0.2em] text-stone/70 lg:block">
        DATUM 2026-08-24
      </div>

      <div className="mx-auto grid w-full max-w-page gap-12 px-6 pb-16 pt-14 md:px-10 lg:grid-cols-[1fr_430px] lg:gap-10 lg:pb-20 lg:pt-20">
        {/* statement */}
        <div className="relative">
          <p className="mono flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.625rem] tracking-[0.22em] text-stone" data-reveal>
            <span className="dot bg-accent" />
            OPEN BENCHMARK DATABASE
            <span className="text-ink/30">···</span>
            SPEC v1.2.0
          </p>

          <h1 className="font-disp mt-7 text-[clamp(2.35rem,5.6vw,4.9rem)] font-extrabold uppercase leading-[0.97] tracking-[-0.02em]" data-reveal style={{ "--reveal-delay": "80ms" } as React.CSSProperties}>
            AI benchmarks
            <br />
            shouldn&rsquo;t be{" "}
            <span className="strike-line" data-strike>
              trusted.
            </span>
            <br />
            <span className="text-graphite">They should be</span>
            <br />
            <span className="relative inline-block text-accent">
              reproduced.
              <span aria-hidden className="absolute -bottom-2 left-0 h-[3px] w-full bg-accent" />
            </span>
          </h1>

          <p className="mt-8 max-w-[52ch] text-[0.9375rem] leading-relaxed text-graphite" data-reveal style={{ "--reveal-delay": "160ms" } as React.CSSProperties}>
            ReBench is an open benchmark database built from independently
            reproduced runs, transparent configurations and publicly auditable
            results. Every number traces to a machine, a revision and a commit.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4" data-reveal style={{ "--reveal-delay": "240ms" } as React.CSSProperties}>
            <Link href="/methodology#run" className="btn btn-solid">
              RUN A BENCHMARK <span aria-hidden>→</span>
            </Link>
            <Link href="/benchmarks" className="btn btn-line">
              EXPLORE RESULTS
            </Link>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="link-u ml-1">
              VIEW SOURCE ↗
            </a>
          </div>

          <div className="mt-10" data-reveal style={{ "--reveal-delay": "320ms" } as React.CSSProperties}>
            <TopRunsAscii />
          </div>
        </div>

        {/* instrument bay */}
        <div className="relative" data-reveal style={{ "--reveal-delay": "200ms" } as React.CSSProperties}>
          <div className="relative border border-ink/40 bg-night p-3 text-night-paper hard-shadow">
            <CornerMarks />
            <div className="flex items-center justify-between px-1 pb-2 pt-0.5">
              <span className="mono text-[0.5625rem] tracking-[0.24em] text-night-fog">
                CAL. UNIT 01 — INFERENCE STACK
              </span>
              <span className="mono text-[0.5625rem] tracking-[0.24em] text-night-fog">
                ▸ LIVE
              </span>
            </div>

            <CalibrationRig className="h-[240px] w-full sm:h-[280px]" />

            <div className="relative mt-1 px-1 pb-1">
              <div aria-hidden className="ruler-x mb-2 opacity-40" />
              <InstrumentPanel rec={referenceRecord()} />
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between px-1">
            <FigLabel>FIG.01 — RUN 000184 / VERIFIED</FigLabel>
            <FigLabel>θ = 0.22 rad·s⁻¹</FigLabel>
          </div>
        </div>
      </div>
    </section>
  );
}

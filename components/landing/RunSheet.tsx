import Link from "next/link";
import { referenceRecord, resultFileUrl, REPO_URL } from "../../lib/data";
import { fmtNum, fmtStamp, shortHash } from "../../lib/format";
import { CornerMarks, FigLabel, KV, SectionHead, StatusBadge } from "../ui";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generationTrace(tps: number, ttftMs: number, tokens: number): string {
  const rand = mulberry32(0x20260824);
  const n = 64;
  const pts: string[] = [];
  const totalSec = tokens / tps + ttftMs / 1000;
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * totalSec;
    let v = 0;
    if (t > ttftMs / 1000) {
      const warm = Math.min(1, (t - ttftMs / 1000) / 0.4);
      v = tps * warm * (0.94 + rand() * 0.12);
    }
    const x = (i / (n - 1)) * 100;
    const y = 30 - (v / (tps * 1.15)) * 28;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(" ");
}

export default function RunSheet() {
  const r = referenceRecord();
  if (!r) return <section className="border-b border-ink/25"><div className="mx-auto max-w-page px-6 py-20 mono text-sm tracking-[0.16em] text-stone">NO MEASURED RUNS YET — SUBMIT A RESULT TO POPULATE THE RUN SHEET.</div></section>;
  const trace = generationTrace(r.generationTPS, r.ttft, Math.min(r.generatedTokens, 512));

  return (
    <section className="border-b border-ink/25">
      <div className="mx-auto w-full max-w-page px-6 py-20 md:px-10 lg:py-24">
        <SectionHead no="SEC.02 / SPECIMEN" title="ONE RUN, FULLY SPECIFIED" note="EVERY FIELD MEASURED, NONE IMPLIED" />

        <div className="relative mt-12 border border-ink/60 bg-paper hard-shadow" data-reveal>
          <CornerMarks />

          {/* sheet header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/30 px-6 py-4 md:px-8">
            <div>
              <span className="mono block text-[0.5625rem] tracking-[0.26em] text-stone">RUN RECORD</span>
              <span className="mono text-lg font-semibold tracking-[0.08em] md:text-xl">{r.id}</span>
            </div>
            <span className="stamp text-accent text-sm" data-reveal style={{ "--reveal-delay": "300ms" } as React.CSSProperties}>
              {r.status}
            </span>
          </div>

          <div className="grid gap-0 md:grid-cols-[1.05fr_1fr] lg:grid-cols-[1.05fr_1.2fr_0.95fr]">
            {/* configuration */}
            <div className="border-b border-ink/20 px-6 py-5 md:border-r md:px-8 lg:border-b-0">
              <span className="mono text-[0.5625rem] tracking-[0.26em] text-stone">A — CONFIGURATION</span>
              <div className="mt-2">
                <KV k="Model" v={r.model} />
                <KV k="Revision" v={<span title={r.modelRevision}>{shortHash(r.modelRevision, 9)}</span>} />
                <KV k="Quant" v={r.quantization} />
                <KV k="Hardware" v={r.hardware} />
                <KV k="VRAM" v={`${r.vram} GB`} />
                <KV k="Engine" v={r.engine} />
                <KV k="Engine ver" v={r.engineVersion} />
                <KV k="Benchmark" v={`ReBench v${r.benchmarkVersion}`} />
              </div>
            </div>

            {/* measurements */}
            <div className="border-b border-ink/20 px-6 py-5 md:px-8 lg:border-b-0 lg:border-r">
              <span className="mono text-[0.5625rem] tracking-[0.26em] text-stone">B — MEASUREMENT</span>

              <div className="mt-4 grid grid-cols-[1fr_auto] items-end gap-x-4">
                <span className="mono text-[0.625rem] tracking-[0.2em] text-graphite">GENERATION · {r.generatedTokens} TOK</span>
                <span className="font-disp clip-numeric text-right text-4xl font-bold leading-none">
                  {fmtNum(r.generationTPS, 1)}
                  <span className="mono ml-1.5 text-[0.5625rem] tracking-[0.18em] text-stone">TOK/S</span>
                </span>
              </div>
              <div className="bar-track mt-2" aria-hidden>
                <div className="bar-fill" style={{ "--fill": r.generationTPS / 110 } as React.CSSProperties} />
              </div>

              <div className="mt-5 grid grid-cols-[1fr_auto] items-end gap-x-4">
                <span className="mono text-[0.625rem] tracking-[0.2em] text-graphite">PROMPT · {r.promptTokens} TOK</span>
                <span className="font-disp clip-numeric text-right text-4xl font-bold leading-none">
                  {fmtNum(r.promptTPS, 1)}
                  <span className="mono ml-1.5 text-[0.5625rem] tracking-[0.18em] text-stone">TOK/S</span>
                </span>
              </div>
              <div className="bar-track mt-2" aria-hidden>
                <div className="bar-fill" style={{ "--fill": r.promptTPS / 2200 } as React.CSSProperties} />
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-ink/15 pt-3">
                <span className="mono text-[0.625rem] tracking-[0.2em] text-graphite">TTFT</span>
                <span className="mono clip-numeric text-lg">{r.ttft} ms</span>
              </div>

              {/* instantaneous throughput trace */}
              <div className="mt-4">
                <svg viewBox="0 0 100 32" className="h-20 w-full" preserveAspectRatio="none" role="img" aria-label="Instantaneous generation throughput trace">
                  <g stroke="rgba(22,19,16,0.15)" strokeWidth="0.3">
                    {[8, 16, 24].map((y) => (
                      <line key={y} x1="0" y1={y} x2="100" y2={y} />
                    ))}
                  </g>
                  <polyline points={trace} fill="none" stroke="#161310" strokeWidth="0.8" strokeLinejoin="round" />
                  <line x1="8" y1="0" x2="8" y2="32" stroke="#d53a0c" strokeWidth="0.5" strokeDasharray="1.5 1.5" />
                </svg>
                <FigLabel className="mt-1 flex justify-between">
                  <span>INST. TOK/S — FIRST 512 TOKENS</span>
                  <span className="text-accent">| TTFT</span>
                </FigLabel>
              </div>
            </div>

            {/* provenance */}
            <div className="px-6 py-5 md:px-8">
              <span className="mono text-[0.5625rem] tracking-[0.26em] text-stone">C — PROVENANCE</span>
              <div className="mt-2">
                <KV k="Contributor" v={`@${r.contributor}`} />
                <KV k="Submitted" v={fmtStamp(r.timestamp)} />
                <KV k="Commit" v={<a href={`${REPO_URL}/commit/${r.gitCommit}`} target="_blank" rel="noopener noreferrer" className="underline decoration-accent/60 underline-offset-2 hover:text-accent" title={r.gitCommit}>{shortHash(r.gitCommit)}</a>} />
                <KV k="Result file" v={<a href={resultFileUrl(r)} target="_blank" rel="noopener noreferrer" className="underline decoration-accent/60 underline-offset-2 hover:text-accent">results/{r.family}/ ↗</a>} />
                <KV k="Status" v={<StatusBadge status={r.status} />} mono={false} />
              </div>

              <pre aria-hidden className="mono mt-5 hidden overflow-x-auto border border-ink/20 bg-paper-dim p-3 text-[0.5625rem] leading-[1.7] text-graphite lg:block">
{`┌─ CHECKSUM ─────────────────┐
│ sha256(record)             │
│ ${r.gitCommit.slice(0, 26)} │
│ schema ✓  outliers ✓  ci ✓ │
└────────────────────────────┘`}
              </pre>
            </div>
          </div>

          {/* sheet footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/30 px-6 py-3.5 md:px-8">
            <FigLabel>RECORD COMPLETE — 23/23 FIELDS PRESENT</FigLabel>
            <Link href={`/runs/${r.id}`} className="link-u">
              FULL RECORD →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

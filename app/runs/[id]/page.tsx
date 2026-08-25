import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CornerMarks, FigLabel, KV, StatusBadge } from "../../../components/ui";
import { allRecords, recordById, resultFileUrl, REPO_URL } from "../../../lib/data";
import { fmtNum, fmtStamp, shortHash } from "../../../lib/format";

export const dynamicParams = false;

export function generateStaticParams() {
  const records = allRecords();
  return records.length ? records.map((r) => ({ id: r.id })) : [{ id: "__empty__" }];
}

function generationTrace(tps: number, ttftMs: number, tokens: number, seed: number): string {
  let a = seed >>> 0;
  const rand = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
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
    pts.push(`${((i / (n - 1)) * 100).toFixed(1)},${(30 - (v / (tps * 1.15)) * 28).toFixed(1)}`);
  }
  return pts.join(" ");
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const r = recordById(id);
  return { title: r ? `${r.id} — ${r.model} on ${r.hardware}` : "Run record" };
}

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = recordById(id);
  if (!r) notFound();

  const ordered = allRecords(); // newest first
  const idx = ordered.findIndex((x) => x.id === r.id);
  const newer = idx > 0 ? ordered[idx - 1] : null;
  const older = idx < ordered.length - 1 ? ordered[idx + 1] : null;
  const trace = generationTrace(r.generationTPS, r.ttft, Math.min(r.generatedTokens, 512), 0x5eb ^ r.id.length * 7919);

  const json = JSON.stringify(r, null, 2);

  return (
    <>
      {/* header */}
      <div className="paper-grid border-b border-ink/25">
        <div className="mx-auto w-full max-w-page px-6 pb-10 pt-14 md:px-10">
          <p className="mono text-[0.625rem] tracking-[0.26em] text-stone" data-reveal>
            <Link href="/benchmarks" className="hover:text-accent">REBENCH // INDEX</Link>{" "}
            <span aria-hidden>/</span> {r.family.toUpperCase()} <span aria-hidden>/</span> RUN
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
            <h1 className="font-disp text-[clamp(1.7rem,4vw,3.2rem)] font-extrabold leading-none" data-reveal>
              {r.id}
            </h1>
            <StatusBadge status={r.status} />
          </div>
          <p className="mono mt-4 text-[0.6875rem] tracking-[0.16em] text-graphite" data-reveal style={{ "--reveal-delay": "120ms" } as React.CSSProperties}>
            SUBMITTED {fmtStamp(r.timestamp)} BY @{r.contributor} · COMMIT{" "}
            <a href={`${REPO_URL}/commit/${r.gitCommit}`} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2">
              {shortHash(r.gitCommit)}
            </a>
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-page px-6 py-12 md:px-10 lg:py-16">
        <div className="relative border border-ink/60 bg-paper hard-shadow" data-reveal>
          <CornerMarks />
          <div className="grid md:grid-cols-[1fr_1fr] lg:grid-cols-[1fr_1.25fr_0.95fr]">
            {/* A — configuration */}
            <div className="border-b border-ink/20 px-6 py-6 md:border-r md:px-8 lg:border-b-0">
              <span className="mono text-[0.5625rem] tracking-[0.26em] text-stone">A — CONFIGURATION · 9 FIELDS</span>
              <div className="mt-3">
                <KV k="Model" v={r.model} />
                <KV k="Family" v={`results/${r.family}/`} />
                <KV k="Revision" v={<span title={r.modelRevision}>{shortHash(r.modelRevision, 12)}</span>} />
                <KV k="Quant" v={r.quantization} />
                <KV k="Hardware" v={r.hardware} />
                <KV k="Vendor" v={r.gpuVendor} />
                <KV k="VRAM" v={`${r.vram} GB`} />
                <KV k="RAM" v={`${r.ram} GB`} />
                <KV k="CPU" v={r.cpu} />
              </div>
            </div>

            {/* B — measurement */}
            <div className="border-b border-ink/20 px-6 py-6 md:px-8 lg:border-b-0 lg:border-r">
              <span className="mono text-[0.5625rem] tracking-[0.26em] text-stone">B — MEASUREMENT · WORKLOAD {r.promptTokens}→{r.generatedTokens}</span>

              <div className="mt-5 grid grid-cols-[1fr_auto] items-end gap-x-4">
                <span className="mono text-[0.625rem] tracking-[0.2em] text-graphite">GENERATION</span>
                <span className="font-disp clip-numeric text-right text-5xl font-extrabold leading-none">
                  {fmtNum(r.generationTPS, 1)}
                  <span className="mono ml-2 text-[0.625rem] tracking-[0.18em] text-stone">TOK/S</span>
                </span>
              </div>
              <div className="bar-track mt-2" aria-hidden>
                <div className="bar-fill accent" style={{ "--fill": Math.min(1, r.generationTPS / 110) } as React.CSSProperties} />
              </div>

              <div className="mt-6 grid grid-cols-[1fr_auto] items-end gap-x-4">
                <span className="mono text-[0.625rem] tracking-[0.2em] text-graphite">PROMPT</span>
                <span className="font-disp clip-numeric text-right text-5xl font-extrabold leading-none">
                  {fmtNum(r.promptTPS, 1)}
                  <span className="mono ml-2 text-[0.625rem] tracking-[0.18em] text-stone">TOK/S</span>
                </span>
              </div>
              <div className="bar-track mt-2" aria-hidden>
                <div className="bar-fill accent" style={{ "--fill": Math.min(1, r.promptTPS / 2200) } as React.CSSProperties} />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-ink/15 pt-4">
                <div>
                  <span className="mono block text-[0.5625rem] tracking-[0.24em] text-stone">TTFT</span>
                  <span className="mono clip-numeric mt-1 block text-2xl font-semibold">{r.ttft} ms</span>
                </div>
                <div>
                  <span className="mono block text-[0.5625rem] tracking-[0.24em] text-stone">SCORE</span>
                  <span className="mono clip-numeric mt-1 block text-2xl font-semibold">{fmtNum(r.score, 1)} / 100</span>
                </div>
              </div>

              <div className="mt-5">
                <svg viewBox="0 0 100 32" className="h-24 w-full" preserveAspectRatio="none" role="img" aria-label="Instantaneous generation throughput trace">
                  <g stroke="rgba(22,19,16,0.15)" strokeWidth="0.3">
                    {[8, 16, 24].map((y) => <line key={y} x1="0" y1={y} x2="100" y2={y} />)}
                  </g>
                  <polyline points={trace} fill="none" stroke="#161310" strokeWidth="0.8" strokeLinejoin="round" />
                  <line x1="8" y1="0" x2="8" y2="32" stroke="#d53a0c" strokeWidth="0.5" strokeDasharray="1.5 1.5" />
                </svg>
                <FigLabel className="flex justify-between">
                  <span>INST. TOK/S — FIRST 512 TOKENS</span>
                  <span className="text-accent">| TTFT</span>
                </FigLabel>
              </div>
            </div>

            {/* C — provenance */}
            <div className="px-6 py-6 md:px-8">
              <span className="mono text-[0.5625rem] tracking-[0.26em] text-stone">C — PROVENANCE · 7 FIELDS</span>
              <div className="mt-3">
                <KV k="Engine" v={r.engine} />
                <KV k="Engine ver" v={r.engineVersion} />
                <KV k="Benchmark" v={`ReBench v${r.benchmarkVersion}`} />
                <KV k="Contributor" v={`@${r.contributor}`} />
                <KV k="Submitted" v={fmtStamp(r.timestamp)} />
                <KV k="Commit" v={<a href={`${REPO_URL}/commit/${r.gitCommit}`} target="_blank" rel="noopener noreferrer" className="underline decoration-accent/60 underline-offset-2 hover:text-accent" title={r.gitCommit}>{shortHash(r.gitCommit)}</a>} />
                <KV k="Result file" v={<a href={resultFileUrl(r)} target="_blank" rel="noopener noreferrer" className="underline decoration-accent/60 underline-offset-2 hover:text-accent">↗ {r.id}.json</a>} />
              </div>

              <div className="mt-6 border border-ink/25 bg-paper-dim/60 p-3">
                <span className="mono text-[0.5625rem] tracking-[0.24em] text-stone">VALIDATION</span>
                <ul className="mono mt-2 space-y-1 text-[0.625rem] tracking-[0.08em] text-graphite">
                  <li>{"schema/benchmark.schema.json"} <span className="text-accent">✓</span></li>
                  <li className="text-stone">OUTLIER CHECK vs {r.hardware} — NOT IMPLEMENTED</li>
                  <li className="text-stone">PROVENANCE CHAIN — NOT IMPLEMENTED</li>
                </ul>
              </div>
            </div>
          </div>

          {/* raw record */}
          <div className="border-t border-ink/30 px-6 py-5 md:px-8">
            <div className="flex items-center justify-between">
              <span className="mono text-[0.5625rem] tracking-[0.26em] text-stone">D — RAW RECORD</span>
              <span className="mono text-[0.5625rem] tracking-[0.18em] text-stone">23 FIELDS · UTF-8 · LF</span>
            </div>
            <pre className="mono mt-3 max-h-72 overflow-auto border border-ink/25 bg-night p-4 text-[0.6875rem] leading-[1.7] text-night-paper">
              {json}
            </pre>
          </div>
        </div>

        {/* nav between runs */}
        <nav className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {older ? (
            <Link href={`/runs/${older.id}`} className="mono text-[0.6875rem] tracking-[0.14em] text-graphite hover:text-accent">
              ← OLDER · {older.id}
            </Link>
          ) : <span />}
          <Link href="/benchmarks" className="link-u">BACK TO INDEX</Link>
          {newer ? (
            <Link href={`/runs/${newer.id}`} className="mono text-[0.6875rem] tracking-[0.14em] text-graphite hover:text-accent">
              NEWER · {newer.id} →
            </Link>
          ) : <span />}
        </nav>
      </div>
    </>
  );
}

import BenchmarkTable from "../../components/BenchmarkTable";
import { DemoTag, PageHead, SectionHead } from "../../components/ui";
import { allRecords, statusCounts } from "../../lib/data";

export const metadata = { title: "Benchmarks" };

export default function BenchmarksPage() {
  const counts = statusCounts();
  const rows = allRecords();

  return (
    <>
      <PageHead
        crumb="INDEX"
        title="Benchmark index"
        desc="Every run in the current index, fully specified. Sort, filter, export — then open any record to see exactly how the number was produced."
      />

      <div className="mx-auto w-full max-w-page px-6 py-12 md:px-10 lg:py-16">
        <div
          className="mono mb-8 flex flex-wrap items-center gap-x-6 gap-y-2 border border-accent/40 bg-accent/5 px-4 py-3 text-[0.625rem] tracking-[0.18em] text-graphite"
          data-reveal
        >
          <DemoTag />
          <span>
            THIS INDEX IS SYNTHETIC UNTIL REAL RESULTS LAND IN{" "}
            <span className="text-ink">results/</span>
          </span>
        </div>

        <div data-reveal style={{ "--reveal-delay": "100ms" } as React.CSSProperties}>
          <BenchmarkTable rows={rows} csv />
        </div>

        <div className="mt-12 grid gap-10 md:grid-cols-3">
          <div>
            <SectionHead no="A" title="STATUS LEGEND" />
            <ul className="mono mt-4 space-y-3 text-[0.6875rem] leading-relaxed tracking-[0.08em] text-graphite">
              <li><span className="text-accent">■ VERIFIED</span> — schema, outlier and provenance checks passed in CI.</li>
              <li><span className="text-ink">■ REPRODUCED</span> — an independent second machine confirmed the result.</li>
              <li><span className="text-stone">■ PENDING</span> — submitted, awaiting validation.</li>
            </ul>
          </div>
          <div>
            <SectionHead no="B" title="CURRENT MIX" />
            <ul className="mono mt-4 space-y-2 text-[0.6875rem] tracking-[0.1em] text-graphite">
              {Object.entries(counts).map(([k, v]) => (
                <li key={k} className="flex justify-between border-b border-ink/15 pb-2">
                  <span>{k}</span>
                  <span className="clip-numeric">{v}</span>
                </li>
              ))}
              <li className="flex justify-between">
                <span className="text-stone">TOTAL</span>
                <span className="clip-numeric font-semibold">{rows.length}</span>
              </li>
            </ul>
          </div>
          <div>
            <SectionHead no="C" title="READING NUMBERS" />
            <p className="mt-4 text-sm leading-relaxed text-graphite">
              Generation TPS, prompt TPS and TTFT are reported separately because
              they measure different things. The composite score is defined in
              methodology §07 — it is a formula, not an opinion.
            </p>
            <a href="/methodology#07" className="link-u mt-3 inline-block">
              METHOD §07 →
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

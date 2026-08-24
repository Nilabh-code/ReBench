import Link from "next/link";
import CountTo from "../../components/CountTo";
import { DemoTag, PageHead, SectionHead } from "../../components/ui";
import { aggregateContributors, aggregateModels, allRecords, hardwareSlices } from "../../lib/data";
import { contributionWeeks } from "../../lib/demo";
import { fmtDate } from "../../lib/format";

export const metadata = { title: "Contributors" };

const LEVELS = ["bg-ink/10", "bg-ink/30", "bg-ink/55", "bg-ink/80", "bg-ink"];

function cellClass(v: number): string {
  if (v === 0) return "bg-ink/10";
  if (v <= 2) return LEVELS[1];
  if (v <= 5) return LEVELS[2];
  if (v <= 8) return LEVELS[3];
  return LEVELS[4];
}

function MonthLabels() {
  const weeks = contributionWeeks();
  const labels: { idx: number; m: string }[] = [];
  let last = -1;
  weeks.forEach((w, i) => {
    const m = new Date(w.start).getUTCMonth();
    if (m !== last) {
      labels.push({ idx: i, m: w.start.slice(5, 7) });
      last = m;
    }
  });
  return (
    <div className="mono relative mb-1 h-4 text-[0.5625rem] tracking-[0.1em] text-stone" aria-hidden>
      {labels.map((l) => (
        <span key={`${l.idx}-${l.m}`} className="absolute" style={{ left: `${l.idx * 13}px` }}>
          {l.m}
        </span>
      ))}
    </div>
  );
}

export default function ContributorsPage() {
  const people = aggregateContributors();
  const runs = allRecords().length;
  const models = aggregateModels().length;
  const hardware = hardwareSlices().length;
  const weeks = contributionWeeks();

  return (
    <>
      <PageHead
        crumb="CONTRIBUTORS"
        title="The instrument fleet"
        desc="ReBench has no datacentre. Its fleet is contributors' machines — gaming GPUs in bedrooms, workstation cards in labs, a few brave Macs. This page is generated from the run index."
      />

      <div className="mx-auto w-full max-w-page px-6 py-12 md:px-10 lg:py-16">
        {/* summary */}
        <div className="grid grid-cols-2 gap-px border border-ink/30 bg-ink/20 sm:grid-cols-4" data-reveal>
          {[
            { v: people.length, label: "CONTRIBUTORS" },
            { v: runs, label: "RUNS INDEXED" },
            { v: models, label: "MODEL FAMILIES" },
            { v: hardware, label: "HARDWARE CONFIGS" },
          ].map((s) => (
            <div key={s.label} className="bg-paper p-5">
              <span className="font-disp block text-3xl font-extrabold md:text-4xl">
                <CountTo value={s.v} />
              </span>
              <span className="mono mt-1 block text-[0.5625rem] tracking-[0.2em] text-stone">{s.label}</span>
            </div>
          ))}
        </div>

        {/* activity grid */}
        <div className="mt-14">
          <div className="flex items-center justify-between">
            <SectionHead no="A" title="RUN ACTIVITY — 52 WEEKS" />
            <DemoTag />
          </div>
          <div className="mt-5 overflow-x-auto pb-2" data-reveal>
            <MonthLabels />
            <div className="flex gap-[3px]" role="img" aria-label="Grid of benchmark run activity over the last 52 weeks">
              {weeks.map((w) => (
                <div key={w.start} className="flex flex-col gap-[3px]">
                  {w.days.map((d, di) => (
                    <span
                      key={di}
                      title={`${w.start} + ${di}d: ${d} runs`}
                      className={`h-[10px] w-[10px] ${cellClass(d)}`}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="mono mt-2 flex items-center gap-2 text-[0.5625rem] tracking-[0.18em] text-stone">
              LESS {LEVELS.map((l) => <span key={l} className={`h-[10px] w-[10px] ${l}`} />)} MORE
            </div>
          </div>
        </div>

        {/* people table */}
        <div className="mt-16">
          <SectionHead no="B" title="CONTRIBUTOR RECORD" note="SORTED BY RUNS SUBMITTED" />
          <div className="mt-5 overflow-x-auto" data-reveal>
            <table className="bench-table">
              <thead>
                <tr>
                  <th>CONTRIBUTOR</th>
                  <th className="num">RUNS</th>
                  <th className="num">VERIFIED</th>
                  <th>FAMILIES</th>
                  <th>HARDWARE</th>
                  <th>LAST RUN</th>
                </tr>
              </thead>
              <tbody>
                {people.map((p, i) => (
                  <tr key={p.handle} className="row-anim" style={{ animationDelay: `${i * 25}ms` }}>
                    <td>
                      <span className="mono inline-flex items-center gap-2 font-semibold">
                        <span aria-hidden className="dot bg-ink/60" />
                        @{p.handle}
                      </span>
                    </td>
                    <td className="num font-semibold">{p.runs}</td>
                    <td className="num">{p.verified}</td>
                    <td className="text-graphite">{p.families.join(", ")}</td>
                    <td className="max-w-[220px] truncate text-graphite" title={p.hardware.join(", ")}>
                      {p.hardware.join(", ")}
                    </td>
                    <td>
                      <Link
                        href={`/runs/${p.lastRun.id}`}
                        className="text-graphite underline decoration-ink/30 underline-offset-2 hover:text-accent"
                      >
                        {fmtDate(p.lastRun.timestamp)} · ⋯{p.lastRun.id.slice(-6)}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mono mt-4 text-[0.625rem] tracking-[0.18em] text-stone">
            HANDLES MAP TO GITHUB ACCOUNTS · STATS GENERATED FROM results/ · DEMO DATA
          </p>
        </div>
      </div>
    </>
  );
}

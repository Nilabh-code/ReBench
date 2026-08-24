import CountTo from "../CountTo";
import { aggregateContributors, aggregateModels, allRecords, hardwareSlices } from "../../lib/data";
import { asciiActivity } from "../../lib/demo";
import { DemoTag, SectionHead } from "../ui";

export default function Community() {
  const contributors = aggregateContributors();
  const models = new Set(allRecords().map((r) => r.model)).size;
  const hardware = hardwareSlices();
  const totalRuns = allRecords().length;
  const maxHw = hardware[0]?.count ?? 1;
  const grid = asciiActivity();

  return (
    <section className="border-b border-ink/25">
      <div className="mx-auto w-full max-w-page px-6 py-20 md:px-10 lg:py-24">
        <SectionHead no="SEC.07 / NETWORK" title="RUN BY CONTRIBUTORS, NOT BY A COMPANY" note="YOU ARE THE INSTRUMENT FLEET" />

        <div className="mt-12 grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          {/* contribution block */}
          <div>
            <div className="flex items-center justify-between">
              <span className="mono text-[0.5625rem] tracking-[0.26em] text-stone">CONTRIBUTION ACTIVITY — 52 WEEKS</span>
              <DemoTag />
            </div>
            <pre
              aria-hidden
              className="mono mt-4 overflow-x-auto border border-ink/30 bg-paper-dim/70 p-4 text-[0.75rem] leading-[1.6] tracking-[0.30em] text-ink sm:text-sm"
              data-reveal
            >
              {grid.join("\n")}
            </pre>
            <div className="mono mt-2 flex items-center justify-between text-[0.5625rem] tracking-[0.18em] text-stone">
              <span>52 WEEKS AGO</span>
              <span className="flex items-center gap-1.5">
                LESS <span className="text-ink">░ ▒ ▓ █</span> MORE
              </span>
              <span>TODAY</span>
            </div>

            {/* stats */}
            <div className="mt-10 grid grid-cols-2 gap-px border border-ink/30 bg-ink/20 sm:grid-cols-4">
              {[
                { v: contributors.length, label: "CONTRIBUTORS" },
                { v: totalRuns, label: "RUNS INDEXED" },
                { v: models, label: "MODELS" },
                { v: hardware.length, label: "HARDWARE CONFIGS" },
              ].map((s, i) => (
                <div key={s.label} className="bg-paper p-5" data-reveal style={{ "--reveal-delay": `${i * 80}ms` } as React.CSSProperties}>
                  <span className="font-disp block text-3xl font-extrabold md:text-4xl">
                    <CountTo value={s.v} />
                  </span>
                  <span className="mono mt-1 block text-[0.5625rem] tracking-[0.2em] text-stone">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* hardware distribution */}
          <div>
            <span className="mono text-[0.5625rem] tracking-[0.26em] text-stone">RUNS BY HARDWARE</span>
            <ul className="mono mt-4 space-y-2.5 text-[0.6875rem]">
              {hardware.map((h, i) => (
                <li key={h.hardware} className="flex items-center gap-3" data-reveal style={{ "--reveal-delay": `${i * 50}ms` } as React.CSSProperties}>
                  <span className="w-40 shrink-0 truncate tracking-[0.08em] text-graphite sm:w-44">{h.hardware.toUpperCase()}</span>
                  <span className="relative h-[9px] flex-1 bg-paper-dark" aria-hidden>
                    <span className="bar-fill" style={{ "--fill": h.count / maxHw } as React.CSSProperties} />
                  </span>
                  <span className="clip-numeric w-6 text-right">{h.count}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 border border-ink/30 bg-paper-dim/60 p-5">
              <p className="mono text-[0.5625rem] tracking-[0.26em] text-stone">NOTE</p>
              <p className="mt-2 text-sm leading-relaxed text-graphite">
                Counts above reflect the current (demo) index. Community
                statistics are regenerated from <span className="mono text-[0.8125rem]">results/</span> —
                no self-reported totals, ever.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

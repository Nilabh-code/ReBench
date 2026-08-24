import Link from "next/link";
import CountTo from "../../components/CountTo";
import { PageHead, SectionHead } from "../../components/ui";
import { aggregateContributors, aggregateModels, allRecords, hardwareSlices } from "../../lib/data";
import { fmtDate } from "../../lib/format";

export const metadata = { title: "Contributors" };



export default function ContributorsPage() {
  const people = aggregateContributors();
  const runs = allRecords().length;
  const models = aggregateModels().length;
  const hardware = hardwareSlices().length;


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
            <SectionHead no="A" title="RUN ACTIVITY — MEASURED DATA" />
          </div>
          <p className="mono mt-5 border border-ink/20 bg-paper-dim/50 p-4 text-[0.625rem] tracking-[0.16em] text-stone">ACTIVITY GRAPH IS GENERATED FROM MEASURED RESULTS. NO RUNS ARE CURRENTLY INDEXED.</p>
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
                        {p.github ? (
                          <a href={p.github} target="_blank" rel="noreferrer" className="hover:text-accent">
                            @{p.handle}
                          </a>
                        ) : (
                          `@${p.handle}`
                        )}
                      </span>
                    </td>
                    <td className="num font-semibold">{p.runs}</td>
                    <td className="num">{p.verified}</td>
                    <td className="text-graphite">{p.families.join(", ")}</td>
                    <td className="max-w-[220px] truncate text-graphite" title={p.hardware.join(", ")}>
                      {p.hardware.join(", ")}
                    </td>
                    <td>
                      {p.lastRun ? (
                        <Link
                          href={`/runs/${p.lastRun.id}`}
                          className="text-graphite underline decoration-ink/30 underline-offset-2 hover:text-accent"
                        >
                          {fmtDate(p.lastRun.timestamp)} · ⋯{p.lastRun.id.slice(-6)}
                        </Link>
                      ) : (
                        <span className="text-stone">NO RUNS YET</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mono mt-4 text-[0.625rem] tracking-[0.18em] text-stone">
            HANDLES MAP TO GITHUB ACCOUNTS · STATS GENERATED FROM results/ · REGISTERED COLLABORATORS MAY HAVE 0 RUNS
          </p>
        </div>
      </div>
    </>
  );
}

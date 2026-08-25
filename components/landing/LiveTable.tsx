import Link from "next/link";
import BenchmarkTable from "../BenchmarkTable";
import { allRecords } from "../../lib/data";
import { SectionHead } from "../ui";

export default function LiveTable() {
  const rows = allRecords();

  return (
    <section className="border-b border-ink/25">
      <div className="mx-auto w-full max-w-page px-6 py-20 md:px-10 lg:py-24">
        <SectionHead no="SEC.05 / INDEX" title="LIVE BENCHMARKS" note="SORTED BY GENERATION THROUGHPUT" />

        {rows.length ? (
          <>
            <div className="mt-10" data-reveal>
              <BenchmarkTable rows={rows} limit={10} />
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="mono text-[0.625rem] tracking-[0.18em] text-stone">
                SHOWING TOP 10 OF {rows.length} · MEASURED INDEX · UPDATES AFTER CI DEPLOY
              </p>
              <Link href="/benchmarks" className="link-u">OPEN FULL INDEX →</Link>
            </div>
          </>
        ) : (
          <div className="mt-10 border border-ink/30 bg-paper-dim/60 p-8 md:p-12" data-reveal>
            <p className="mono text-[0.625rem] tracking-[0.24em] text-stone">INDEX STATUS // WAITING FOR FIRST MEASURED RUN</p>
            <h3 className="font-disp mt-4 text-3xl font-extrabold md:text-4xl">No benchmark records yet.</h3>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-graphite">
              The leaderboard is intentionally empty until a Docker runner produces a validated result. No synthetic scores are shown here.
            </p>
            <Link href="/methodology#run" className="btn btn-solid mt-7">RUN A BENCHMARK <span aria-hidden>→</span></Link>
          </div>
        )}
      </div>
    </section>
  );
}
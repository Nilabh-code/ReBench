import Link from "next/link";
import BenchmarkTable from "../BenchmarkTable";
import { allRecords } from "../../lib/data";
import { SectionHead } from "../ui";

export default function LiveTable() {
  return (
    <section className="border-b border-ink/25">
      <div className="mx-auto w-full max-w-page px-6 py-20 md:px-10 lg:py-24">
        <SectionHead no="SEC.05 / INDEX" title="LIVE BENCHMARKS" note="SORTED BY GENERATION THROUGHPUT" />

        <div className="mt-10" data-reveal>
          <BenchmarkTable rows={allRecords()} limit={10} />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="mono text-[0.625rem] tracking-[0.18em] text-stone">
            SHOWING TOP 10 OF {allRecords().length} · SYNTHETIC DEMO INDEX
          </p>
          <Link href="/benchmarks" className="link-u">
            OPEN FULL INDEX →
          </Link>
        </div>
      </div>
    </section>
  );
}

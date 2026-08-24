import { SectionHead } from "../ui";

const NODES = [
  { idx: "01", title: "LOCAL MACHINE", note: "your rig · your thermals · your electricity bill" },
  { idx: "02", title: "BENCHMARK RUNNER", note: "fixed workload · pinned versions · v1.2.0" },
  { idx: "03", title: "RAW RESULT", note: "one JSON file · 23 fields · schema-attached" },
  { idx: "04", title: "GITHUB", note: "pull request → results/{family}/" },
  { idx: "05", title: "VALIDATION", note: "schema ✓ · outlier check ✓ · second run" },
  { idx: "06", title: "WEBSITE", note: "index regenerated · static · auditable" },
];

export default function ProcessFlow() {
  return (
    <section className="border-b border-ink/25 bg-paper-dim/50">
      <div className="mx-auto w-full max-w-page px-6 py-20 md:px-10 lg:py-24">
        <SectionHead no="SEC.03 / PIPELINE" title="HOW A NUMBER BECOMES A RECORD" note="NO SERVERS BETWEEN YOU AND THE DATA" />

        {/* desktop: horizontal conveyor */}
        <div className="relative mt-14 hidden lg:block" data-reveal>
          <div aria-hidden className="absolute left-0 right-0 top-[26px] h-px bg-ink/40" />
          {/* packets */}
          <div aria-hidden className="absolute left-0 right-0 top-[23px] h-[7px]">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="packet-x absolute top-0 h-[7px] w-[7px] bg-accent"
                style={{ animationDelay: `${i * 2.6}s` }}
              />
            ))}
          </div>

          <ol className="relative grid grid-cols-6 gap-4">
            {NODES.map((n, i) => (
              <li key={n.idx} className="flex flex-col">
                <span
                  className="relative z-10 ml-1 h-[13px] w-[13px] shrink-0 border border-ink bg-paper"
                  style={{ animation: `node-pulse 1.6s ease-in-out ${i * 0.28}s infinite` }}
                  aria-hidden
                />
                <div className="mt-5 border border-ink/40 bg-paper p-4">
                  <span className="mono text-[0.5625rem] tracking-[0.26em] text-stone">{n.idx}</span>
                  <span className="font-disp mt-1 block text-[0.9375rem] font-bold leading-tight">{n.title}</span>
                  <span className="mono mt-2 block text-[0.5625rem] leading-relaxed tracking-[0.08em] text-graphite">{n.note}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* mobile / tablet: vertical chute */}
        <div className="relative mt-12 lg:hidden">
          <div aria-hidden className="absolute bottom-2 left-[6px] top-2 w-px bg-ink/40" />
          <span
            aria-hidden
            className="packet-y absolute left-[3px] z-10 h-[7px] w-[7px] bg-accent"
            style={{ animation: "packet-y 7s linear infinite" }}
          />
          <ol className="relative space-y-6 pl-8">
            {NODES.map((n, i) => (
              <li key={n.idx} className="relative" style={{ "--reveal-delay": `${i * 80}ms` } as React.CSSProperties} data-reveal>
                <span aria-hidden className="absolute -left-8 top-1.5 h-[13px] w-[13px] border border-ink bg-paper" />
                <div className="border border-ink/40 bg-paper p-4">
                  <div className="flex items-baseline gap-3">
                    <span className="mono text-[0.5625rem] tracking-[0.26em] text-stone">{n.idx}</span>
                    <span className="font-disp text-base font-bold">{n.title}</span>
                  </div>
                  <span className="mono mt-1.5 block text-[0.625rem] leading-relaxed tracking-[0.08em] text-graphite">{n.note}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <p className="mono mt-10 text-center text-[0.6875rem] tracking-[0.2em] text-stone" data-reveal>
          EVERYTHING BETWEEN &ldquo;RUN&rdquo; AND &ldquo;PUBLISHED&rdquo; IS VISIBLE IN THE REPOSITORY.
        </p>
      </div>
    </section>
  );
}

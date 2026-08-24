import Link from "next/link";
import { PageHead, SectionHead, StatusBadge } from "../../components/ui";
import { aggregateModels, allRecords } from "../../lib/data";
import { asciiBar, fmtNum } from "../../lib/format";

export const metadata = { title: "Models" };

export default function ModelsPage() {
  const models = aggregateModels();
  const maxGen = Math.max(...models.map((m) => m.bestGenerationTPS));
  const families = new Set(models.map((m) => m.family)).size;

  return (
    <>
      <PageHead
        crumb="MODELS"
        title="Models"
        desc="Same model, different machine, different number. One section per model, grouped under the results/ directory of its family. Tokens/s is only comparable within a model."
      />

      <div className="mx-auto w-full max-w-page px-6 py-12 md:px-10 lg:py-16">
        {/* overview */}
        <SectionHead no="A" title="BEST OBSERVED GENERATION / MODEL" note="DEMO DATA" />
        <ul className="mono mt-5 space-y-2.5 text-[0.6875rem]" data-reveal>
          {models.map((m) => (
            <li key={m.model} className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
              <span className="w-44 shrink-0 truncate tracking-[0.08em] text-graphite">
                {m.model.toUpperCase()}
              </span>
              <span aria-hidden className="relative hidden h-[9px] flex-1 bg-paper-dark sm:block">
                <span className="bar-fill" style={{ "--fill": m.bestGenerationTPS / maxGen } as React.CSSProperties} />
              </span>
              <span className="clip-numeric w-16 shrink-0 text-right font-semibold">
                {fmtNum(m.bestGenerationTPS, 1)}
              </span>
              <span className="w-14 shrink-0 text-right text-stone">tok/s</span>
            </li>
          ))}
        </ul>

        {/* family detail */}
        <div className="mt-16 space-y-14">
          {models.map((fam, fi) => (
            <section key={fam.model} aria-label={fam.model}>
              <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-ink/40 pb-3" data-reveal>
                <span className="mono text-[0.625rem] tracking-[0.22em] text-stone">
                  {String(fi + 1).padStart(2, "0")} /
                </span>
                <h2 className="font-disp text-2xl font-extrabold md:text-3xl">{fam.model}</h2>
                <span className="mono text-[0.625rem] tracking-[0.18em] text-stone">
                  results/{fam.family}/ · {fam.runs.length} RUNS · {fam.hardwareCount} HARDWARE CONFIGS
                </span>
                <span className="mono ml-auto hidden text-[0.625rem] tracking-[0.18em] text-stone md:block">
                  QUANTS: {fam.quants.join(" · ")}
                </span>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="bench-table">
                  <thead>
                    <tr>
                      <th>RUN</th>
                      <th>QUANT</th>
                      <th>HARDWARE</th>
                      <th>ENGINE</th>
                      <th className="num">GEN TOK/S</th>
                      <th className="num">PROMPT TOK/S</th>
                      <th className="num">TTFT</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fam.runs.map((r, i) => (
                      <tr key={r.id} className="row-anim" style={{ animationDelay: `${i * 30}ms` }}>
                        <td>
                          <Link href={`/runs/${r.id}`} className="text-graphite underline decoration-ink/30 underline-offset-2 hover:text-accent">
                            {r.id.slice(-6)}
                          </Link>
                        </td>
                        <td>{r.quantization}</td>
                        <td className="text-graphite">{r.hardware}</td>
                        <td className="text-graphite">{r.engine} {r.engineVersion}</td>
                        <td className="num font-semibold">{fmtNum(r.generationTPS, 1)}</td>
                        <td className="num">{fmtNum(r.promptTPS, 1)}</td>
                        <td className="num">{r.ttft} ms</td>
                        <td><StatusBadge status={r.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <pre aria-hidden className="mono mt-3 hidden overflow-x-auto text-[0.625rem] leading-[1.6] text-stone lg:block" data-reveal>
                {`${fam.model.padEnd(24)} gen tok/s  ${asciiBar(fam.bestGenerationTPS, maxGen, 32)}  ${fmtNum(fam.bestGenerationTPS, 1)}`}
              </pre>
            </section>
          ))}
        </div>

        <p className="mono mt-14 border-t border-ink/25 pt-6 text-center text-[0.625rem] tracking-[0.2em] text-stone">
          {allRecords().length} RUNS ACROSS {models.length} MODELS · {families} FAMILIES · INDEX: DEMO DATA
        </p>
      </div>
    </>
  );
}

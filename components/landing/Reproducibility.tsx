import { referenceRecord } from "../../lib/data";
import { shortHash } from "../../lib/format";
import { SectionHead } from "../ui";

const MISSING = ["GPU", "QUANTIZATION", "ENGINE", "ENGINE VERSION", "PROMPT LENGTH", "BENCHMARK VERSION", "MODEL REVISION", "AMBIENT CONDITIONS"];

export default function Reproducibility() {
  const r = referenceRecord();
  if (!r) return <section className="border-b border-ink/25"><div className="mx-auto max-w-page px-6 py-20 mono text-sm tracking-[0.16em] text-stone">NO MEASURED RUNS YET — REPRODUCIBILITY DATA WILL APPEAR AFTER THE FIRST RUN.</div></section>;

  return (
    <section className="border-b border-ink/25 bg-paper-dim/50">
      <div className="mx-auto w-full max-w-page px-6 py-20 md:px-10 lg:py-24">
        <SectionHead no="SEC.06 / CONTROL" title="CLAIM vs RECORD" note="SAME NUMBER · DIFFERENT VALUE" />

        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-14">
          {/* CLAIM — deliberately incomplete */}
          <div className="relative" data-reveal>
            <span className="mono absolute -top-3 left-4 bg-paper-dim px-2 text-[0.5625rem] tracking-[0.26em] text-stone">
              FIG.A — THE CLAIM
            </span>
            <div className="rotate-[-0.4deg] border border-dashed border-stone bg-paper p-7 md:p-9">
              <p className="mono text-[0.625rem] tracking-[0.22em] text-stone">MARKETING PAGE, PROBABLY</p>
              <blockquote className="font-disp mt-4 text-center text-4xl font-extrabold md:text-5xl">
                &ldquo;Model X hits{" "}
                <span className="bg-paper-dark px-1">80 tok/s</span>&rdquo;
              </blockquote>
              <div className="mt-8 border-t border-dashed border-stone pt-5">
                <p className="mono text-[0.5625rem] tracking-[0.26em] text-stone">FIELDS SUPPLIED: 0</p>
                <ul className="mt-3 space-y-2">
                  {MISSING.map((m, i) => (
                    <li
                      key={m}
                      className="mono flex items-center justify-between text-[0.6875rem] tracking-[0.14em] text-stone"
                      style={{ "--reveal-delay": `${200 + i * 70}ms` } as React.CSSProperties}
                      data-reveal
                    >
                      <span>{m}</span>
                      <span aria-hidden className="h-[7px] w-16 bg-stone/40 sm:w-24" />
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-8 flex items-center justify-between">
                <span className="stamp text-stone text-xs">UNREPRODUCIBLE</span>
                <span className="mono text-[0.5625rem] tracking-[0.2em] text-stone">REPRODUCIBILITY: 0%</span>
              </div>
            </div>
          </div>

          {/* REBENCH RECORD — precise */}
          <div className="relative" data-reveal style={{ "--reveal-delay": "150ms" } as React.CSSProperties}>
            <span className="mono absolute -top-3 left-4 bg-paper-dim px-2 text-[0.5625rem] tracking-[0.26em] text-stone">
              FIG.B — THE REBENCH RECORD
            </span>
            <div className="border border-ink bg-paper hard-shadow p-7 md:p-9">
              <p className="mono text-[0.625rem] tracking-[0.22em] text-stone">{r.id}</p>
              <blockquote className="font-disp mt-4 text-4xl font-extrabold md:text-5xl">
                {r.generationTPS.toFixed(1)} tok/s
                <span className="mono ml-2 align-middle text-[0.625rem] tracking-[0.18em] text-graphite">GEN · {r.generatedTokens} TOK</span>
              </blockquote>

              <div className="mono mt-8 grid grid-cols-1 gap-x-8 border-t border-ink/25 pt-5 text-[0.6875rem] sm:grid-cols-2">
                {(
                  [
                    ["MODEL", r.model],
                    ["REVISION", shortHash(r.modelRevision)],
                    ["QUANT", r.quantization],
                    ["GPU", `${r.hardware} · ${r.vram} GB`],
                    ["CPU", r.cpu],
                    ["RAM", `${r.ram} GB`],
                    ["ENGINE", `${r.engine} ${r.engineVersion}`],
                    ["WORKLOAD", `${r.promptTokens}→${r.generatedTokens} TOK`],
                    ["BENCHMARK", `v${r.benchmarkVersion}`],
                    ["COMMIT", shortHash(r.gitCommit)],
                  ] as const
                ).map(([k, v], i) => (
                  <div key={k} className="flex items-baseline justify-between border-b border-ink/10 py-[6px]" data-reveal style={{ "--reveal-delay": `${220 + i * 55}ms` } as React.CSSProperties}>
                    <span className="text-[0.5625rem] tracking-[0.2em] text-stone">{k}</span>
                    <span className="clip-numeric">{v}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center justify-between">
                <span className="stamp text-accent text-xs">{r.status}</span>
                <span className="mono text-[0.5625rem] tracking-[0.2em] text-stone">REPRODUCIBILITY: 100%*</span>
              </div>
            </div>
            <p className="mono mt-3 px-2 text-[0.5625rem] leading-relaxed tracking-[0.14em] text-stone">
              *ANYONE CAN RE-RUN THIS EXACT CONFIGURATION AND COMPARE. THAT IS THE POINT.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

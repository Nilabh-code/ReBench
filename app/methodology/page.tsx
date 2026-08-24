import Link from "next/link";
import { PageHead } from "../../components/ui";

export const metadata = { title: "Methodology" };

const CLAUSES = [
  {
    n: "01",
    t: "HARDWARE",
    body: [
      "The device under test is fingerprinted by the runner, not reported by the contributor: GPU model, VRAM, system RAM, CPU and driver/toolkit version are read from the machine at run time.",
      "Thermal state is logged ambiently where possible. A run produced on a throttling card is not silently equal to one that is not.",
    ],
    spec: "hw.report = fingerprint(gpu, vram, ram, cpu, driver)",
  },
  {
    n: "02",
    t: "MODEL",
    body: [
      "Weights are pinned to an exact revision hash from the source repository. There is no 'latest' — only a hash.",
      "Two runs of the same named model at different revisions are different runs and are never merged.",
    ],
    spec: "model.ref = sha256-pinned revision, never 'latest'",
  },
  {
    n: "03",
    t: "QUANTIZATION",
    body: [
      "The quantization format and the implementation that produced it are part of the record. Q4_K_M is not 'roughly 4-bit'; it is a specific layout with a specific history.",
      "FP16, FP8 and INT-family formats are recorded with their runtime, since kernels differ.",
    ],
    spec: "quant = { format, implementation, group_size? }",
  },
  {
    n: "04",
    t: "ENGINE",
    body: [
      "The inference engine and its exact version (or build tag) are recorded. Build flags are captured where the engine exposes them.",
      "The engine is half the benchmark. A number attributed to a model without its engine is attributed to nothing.",
    ],
    spec: "engine = { name, version, flags[] }",
  },
  {
    n: "05",
    t: "PROMPT",
    body: [
      "The workload ships with the runner: fixed prompt length, fixed generation length, fixed prompt construction. Contributors cannot edit it per-run.",
      "Workload identifiers are versioned. standard-4096→2048 means exactly that: 4096 prompt tokens, 2048 generated tokens.",
    ],
    spec: "workload = standard-{prompt}→{gen}, checksum-locked",
  },
  {
    n: "06",
    t: "GENERATION",
    body: [
      "Sampling parameters are pinned by the workload (temperature, top-k, top-p, seed). Generation is measured token-by-token from the first generated token.",
      "Warmup iterations and cache priming happen outside the measured window and are recorded separately.",
    ],
    spec: "measure window = [token₁, tokenₙ], warmup excluded",
  },
  {
    n: "07",
    t: "MEASUREMENT",
    body: [
      "Three primary quantities are reported separately: prompt evaluation throughput (prompt TPS), generation throughput (gen TPS), and time to first token (TTFT). They measure different machinery and are never blended silently.",
      "The composite index is an open formula, evaluated from the three quantities against a published reference curve:",
    ],
    spec: "score = 0.55·g + 0.30·p + 0.15·t , clamped 0–100",
  },
  {
    n: "08",
    t: "VALIDATION",
    body: [
      "Submission is a pull request. CI validates the record against schema/benchmark.schema.json, checks outliers against sibling runs on the same hardware, and verifies the provenance chain.",
      "A run is REPRODUCED when a second, independent machine confirms it, and VERIFIED when CI has passed schema, outlier and provenance checks. PENDING means the record exists but has not yet been validated.",
    ],
    spec: "PENDING → REPRODUCED → VERIFIED, all state in git",
  },
];

const VERSIONS = [
  { v: "1.2.0", d: "2026-08", c: "TTFT in primary record; composite index weights revised; warmup isolation enforced." },
  { v: "1.1.0", d: "2026-05", c: "Engine build flags recorded; prompt construction checksum-locked." },
  { v: "1.0.0", d: "2026-02", c: "Initial schema; 23-field record; GitHub-as-backend model." },
];

export default function MethodologyPage() {
  return (
    <>
      <PageHead
        crumb="METHOD"
        title="Methodology"
        desc="Document RB-M-001, version 1.2. The methodology is versioned like code: when it changes, the benchmark version changes, and old numbers are never silently compared against new ones."
      />

      <div className="mx-auto w-full max-w-page px-6 py-12 md:px-10 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
          {/* clauses */}
          <div>
            <ol className="space-y-0 border-t border-ink/30">
              {CLAUSES.map((c) => (
                <li key={c.n} id={c.n} className="scroll-mt-32 border-b border-ink/30 py-8" data-reveal>
                  <div className="flex items-baseline gap-4">
                    <span className="mono text-[0.75rem] tracking-[0.2em] text-accent">§{c.n}</span>
                    <h2 className="font-disp text-2xl font-extrabold">{c.t}</h2>
                  </div>
                  {c.body.map((p, i) => (
                    <p key={i} className="mt-4 max-w-[68ch] text-[0.9375rem] leading-relaxed text-graphite">
                      {p}
                    </p>
                  ))}
                  <pre className="mono mt-4 overflow-x-auto border-l-2 border-accent bg-paper-dim px-4 py-2.5 text-[0.6875rem] tracking-[0.06em] text-ink">
                    {c.spec}
                  </pre>
                </li>
              ))}
            </ol>

            {/* suite catalog */}
            <section id="suites" className="scroll-mt-32 border-t border-ink/30 pt-10">
              <div className="flex items-baseline justify-between gap-4">
                <div><span className="mono text-[0.75rem] tracking-[0.2em] text-accent">§09</span><h2 className="font-disp mt-2 text-2xl font-extrabold">Evaluation suites</h2></div>
                <span className="mono text-[0.625rem] tracking-[0.16em] text-stone">VERSION 0.1.0</span>
              </div>
              <p className="mt-4 max-w-[68ch] text-[0.9375rem] leading-relaxed text-graphite">ReBench will publish separate, versioned leaderboards for software-engineering tasks. These are original ReBench specifications inspired by the need for focused evaluations; they are not copied from private third-party datasets.</p>
              <div className="mt-6 grid gap-px border border-ink/25 bg-ink/20 sm:grid-cols-2">
                {[['TEST WRITING','Add meaningful tests; score hidden regression and mutation checks.'],['REFACTORING','Improve structure while preserving behavior; score regression and static checks.'],['CODEBASE Q&A','Answer repository questions with file/line evidence; score grounding.'],['BUG FIXING','Diagnose and patch a real issue; score hidden reproducer and regressions.']].map(([title, desc]) => <div key={title} className="bg-paper p-5"><span className="mono text-[0.625rem] tracking-[0.18em] text-accent">{title}</span><p className="mt-2 text-sm leading-relaxed text-graphite">{desc}</p><span className="mono mt-3 block text-[0.5625rem] tracking-[0.14em] text-stone">TASK PASS RATE · VERSIONED</span></div>)}
              </div>
            </section>

            {/* run a benchmark */}
            <section id="run" className="scroll-mt-32">
              <div className="mt-14 border border-ink bg-night text-night-paper hard-shadow">
                <div className="flex items-center justify-between border-b border-night-edge px-5 py-3">
                  <span className="mono text-[0.625rem] tracking-[0.26em] text-night-fog">RUN A BENCHMARK</span>
                  <span className="mono text-[0.625rem] tracking-[0.18em] text-accent">SPEC PREVIEW</span>
                </div>
                <div className="px-5 py-5">
                  <p className="max-w-[64ch] text-sm leading-relaxed text-night-paper/90">
                    The standardized runner is the only sanctioned way into the
                    index. It reads the machine, locks the workload, runs it, and
                    writes one JSON record — which you submit as a pull request.
                  </p>
                  <pre className="mono mt-5 overflow-x-auto border border-night-edge bg-night-raise p-4 text-[0.75rem] leading-[1.9] text-night-paper">
{`$ git clone https://github.com/Nilabh-code/ReBench
$ cd ReBench
$ mkdir -p out
$ docker build -t rebench-runner:dev -f benchmark/Dockerfile benchmark
$ docker run --rm --user "$(id -u):$(id -g)" \\
    --network host \\
    -v "$PWD/out:/output" \\
    -e REBENCH_HARDWARE="RTX 5060 Ti" \\
    -e REBENCH_GPU_VENDOR="NVIDIA" \\
    -e REBENCH_VRAM_GB=16 \\
    -e REBENCH_RAM_GB=32 \\
    -e REBENCH_CPU="your CPU" \\
    --env REBENCH_API_KEY \\
    rebench-runner:dev \\
    --base-url http://127.0.0.1:8000/v1 \\
    --model your-model \\
    --suite performance \\
    --manifest benchmark/performance.json \\
    --family your-family \\
    --contributor Nilabh-code \\
    --model-revision 0000000 \\
    --git-commit 0000000 \\
    --output /output/run.json \\
    --status-file /output/status.json
  ▸ fingerprinting … ok
  ▸ warming_up … ok
  ▸ measuring 3 repetitions … ok
  ▸ wrote out/run.json + out/status.json
  ▸ timingSource: provider or estimated_from_ttft
$ cp out/run.json results/your-family/
$ npm run validate && npm run generate:data
$ git add results/ data/benchmarks.json
$ git commit -m "results: add measured benchmark run"
$ git push -u origin HEAD
$ gh pr create --fill`}
                  </pre>
                  <p className="mono mt-4 text-[0.625rem] leading-relaxed tracking-[0.14em] text-night-fog">
                    RUNNER v1.2.0 LANDS WITH THE FIRST REAL RESULTS. INTERFACE SHOWN IS THE FROZEN SPEC.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* sidebar */}
          <aside className="space-y-8 lg:sticky lg:top-36 lg:self-start">
            <div className="border border-ink/40 bg-paper-dim/60 p-5" data-reveal>
              <p className="mono text-[0.5625rem] tracking-[0.26em] text-stone">DOCUMENT</p>
              <p className="mono mt-2 text-sm">RB-M-001 / v1.2 / RATIFIED 2026-08</p>
              <p className="mt-3 text-[0.8125rem] leading-relaxed text-graphite">
                Changes to this document are pull requests. They are discussed in
                the open and versioned on merge.
              </p>
            </div>

            <div data-reveal>
              <p className="mono text-[0.5625rem] tracking-[0.26em] text-stone">VERSION HISTORY</p>
              <ul className="mt-3 space-y-0 border-t border-ink/30">
                {VERSIONS.map((v) => (
                  <li key={v.v} className="border-b border-ink/20 py-3">
                    <div className="mono flex items-baseline justify-between text-[0.75rem]">
                      <span className="font-semibold text-accent">v{v.v}</span>
                      <span className="text-stone">{v.d}</span>
                    </div>
                    <p className="mono mt-1.5 text-[0.625rem] leading-relaxed tracking-[0.06em] text-graphite">
                      {v.c}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div data-reveal>
              <p className="mono text-[0.5625rem] tracking-[0.26em] text-stone">SEE ALSO</p>
              <ul className="mono mt-3 space-y-2 text-[0.6875rem] tracking-[0.12em]">
                <li><Link href="/benchmarks" className="link-u">BENCHMARK INDEX →</Link></li>
                <li><Link href="/runs/RUN-2026-08-24-000184" className="link-u">REFERENCE RUN →</Link></li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

import RepoTree from "../RepoTree";
import { CornerMarks, SectionHead } from "../ui";
import { REPO_URL } from "../../lib/data";

const COMMITS = [
  { hash: "a1f3c9e", msg: "results: add RUN-2026-08-24-000184 (qwen3-27b / q4_k_m)", time: "2h" },
  { hash: "9b2d4f7", msg: "verify: mark RUN-2026-08-23-000182 as VERIFIED", time: "9h" },
  { hash: "c4e81a2", msg: "results: reproduce llama-3.1-70b on a100 (2nd machine)", time: "1d" },
  { hash: "7f05b3d", msg: "schema: tighten ttft bounds in benchmark.schema.json", time: "3d" },
  { hash: "e2a96c1", msg: "runner: fix warmup iteration counted in ttft", time: "5d" },
];

export default function GithubSection() {
  return (
    <section className="night-grid bg-night text-night-paper">
      <div className="mx-auto w-full max-w-page px-6 py-20 md:px-10 lg:py-24">
        <SectionHead night no="SEC.04 / SOURCE OF TRUTH" title="THE DATABASE IS PUBLIC" note="GIT IS THE BACKEND" />

        <div className="mt-12 grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          <div>
            <h2 className="font-disp text-[clamp(1.9rem,3.8vw,3.1rem)] font-extrabold uppercase leading-[1.02]" data-reveal>
              No hidden database.
              <br />
              <span className="text-night-fog">No private index.</span>
              <br />
              Just a repository.
            </h2>
            <p className="mt-6 max-w-[48ch] text-[0.9375rem] leading-relaxed text-night-fog">
              Results land as pull requests. Validation runs in CI. The
              website regenerates from the commit you can read below.
              If a number disappears from the repo, it disappears from
              the site — that is the guarantee.
            </p>

            {/* commit feed */}
            <div className="relative mt-8" data-reveal style={{ "--reveal-delay": "150ms" } as React.CSSProperties}>
              <CornerMarks light />
              <div className="border border-night-edge">
                {COMMITS.map((c, i) => (
                  <div
                    key={c.hash}
                    className={`mono flex items-baseline gap-3 px-4 py-2.5 text-[0.6875rem] ${
                      i > 0 ? "border-t border-night-edge" : ""
                    }`}
                  >
                    <span className="shrink-0 text-accent">{c.hash}</span>
                    <span className="truncate text-night-paper/90">{c.msg}</span>
                    <span className="ml-auto shrink-0 text-night-fog">{c.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-night mt-8"
            >
              VIEW SOURCE ↗
            </a>
          </div>

          <div data-reveal style={{ "--reveal-delay": "220ms" } as React.CSSProperties}>
            <RepoTree />
            <p className="mono mt-2 flex justify-between text-[0.5625rem] tracking-[0.2em] text-night-fog">
              <span>FIG.02 — LIVE REPOSITORY TREE</span>
              <span>READ-ONLY VIEW</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

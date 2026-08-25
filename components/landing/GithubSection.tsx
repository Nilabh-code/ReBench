import RepoTree from "../RepoTree";
import { CornerMarks, SectionHead } from "../ui";
import { allRecords, REPO_URL } from "../../lib/data";

export default function GithubSection() {
  const commits = allRecords()
    .slice(0, 5)
    .map((r) => ({ id: r.id, hash: r.gitCommit.slice(0, 7), msg: `results: add ${r.id} (${r.model} / ${r.quantization})` }));

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

            {/* commit feed — rendered from the real index, empty until the first measured run lands */}
            <div className="relative mt-8" data-reveal style={{ "--reveal-delay": "150ms" } as React.CSSProperties}>
              <CornerMarks light />
              <div className="border border-night-edge">
                {commits.length ? (
                  commits.map((c, i) => (
                    <div
                      key={c.id}
                      className={`mono flex items-baseline gap-3 px-4 py-2.5 text-[0.6875rem] ${
                        i > 0 ? "border-t border-night-edge" : ""
                      }`}
                    >
                      <span className="shrink-0 text-accent">{c.hash}</span>
                      <span className="truncate text-night-paper/90">{c.msg}</span>
                    </div>
                  ))
                ) : (
                  <div className="mono px-4 py-5 text-[0.6875rem] tracking-[0.16em] text-night-fog">
                    NO MEASURED RUNS COMMITTED YET · THIS FEED RENDERS FROM results/ — NOTHING HERE IS SYNTHESIZED
                  </div>
                )}
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
              <span>FIG.02 — REPOSITORY TREE</span>
              <span>READ-ONLY VIEW</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { DISCORD_URL, REPO_URL } from "../../lib/data";

export default function FinalCall() {
  return (
    <section className="night-grid relative overflow-hidden bg-night text-night-paper">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 border border-night-edge sm:h-[640px] sm:w-[640px]" />
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-px w-full max-w-page bg-night-edge" />

      <div className="relative mx-auto w-full max-w-page px-6 py-24 text-center md:px-10 lg:py-32">
        <p className="mono text-[0.625rem] tracking-[0.3em] text-night-fog" data-reveal>
          CONCLUSION
        </p>
        <h2
          className="font-disp mx-auto mt-8 max-w-[16ch] text-[clamp(2.6rem,7vw,6rem)] font-extrabold uppercase leading-[0.98]"
          data-reveal
          style={{ "--reveal-delay": "100ms" } as React.CSSProperties}
        >
          Don&rsquo;t trust
          <br />
          the number.
        </h2>
        <p
          className="font-disp mt-4 text-[clamp(2.6rem,7vw,6rem)] font-extrabold uppercase leading-[0.98] text-accent"
          data-reveal
          style={{ "--reveal-delay": "250ms" } as React.CSSProperties}
        >
          Reproduce it.
        </p>

        <div
          className="mt-12 flex flex-wrap items-center justify-center gap-4"
          data-reveal
          style={{ "--reveal-delay": "400ms" } as React.CSSProperties}
        >
          <Link href="/methodology#run" className="btn btn-night">
            RUN A BENCHMARK →
          </Link>
          <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="mono link-u !text-night-paper hover:!text-accent">
            JOIN DISCORD ↗
          </a>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="mono link-u !text-night-paper hover:!text-accent">
            VIEW SOURCE ↗
          </a>
        </div>

        <p className="mono mx-auto mt-14 max-w-[70ch] text-[0.625rem] leading-[2] tracking-[0.18em] text-night-fog" data-reveal>
          ONE RUN · ONE JSON FILE · ONE COMMIT · NO EXCEPTIONS
        </p>
      </div>
    </section>
  );
}

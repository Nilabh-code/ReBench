import type { CSSProperties } from "react";
import { SectionHead } from "../ui";

const CHIPS: { k: string; pos: { left: string; top: string }; line: [number, number] }[] = [
  { k: "MODEL", pos: { left: "36%", top: "2%" }, line: [48, 7] },
  { k: "QUANTIZATION", pos: { left: "60%", top: "9%" }, line: [68, 13] },
  { k: "HARDWARE", pos: { left: "66%", top: "45%" }, line: [72, 49] },
  { k: "ENGINE", pos: { left: "0%", top: "45%" }, line: [10, 49] },
  { k: "CONTEXT", pos: { left: "63%", top: "80%" }, line: [70, 83] },
  { k: "VERSION", pos: { left: "2%", top: "80%" }, line: [12, 83] },
  { k: "PARAMETERS", pos: { left: "0%", top: "9%" }, line: [10, 13] },
  { k: "BENCHMARK", pos: { left: "36%", top: "90%" }, line: [50, 93] },
];

export default function Problem() {
  return (
    <section className="night-grid bg-night text-night-paper">
      <div className="mx-auto w-full max-w-page px-6 py-20 md:px-10 lg:py-28">
        <SectionHead night no="SEC.01 / OBSERVATION" title="THE PROBLEM" note="N = 1 NUMBER, 0 CONTEXT" />

        <div className="mt-14 grid items-center gap-16 lg:grid-cols-[1fr_1fr]">
          {/* statement */}
          <div>
            <h2 className="font-disp text-center text-[clamp(2rem,4.4vw,3.7rem)] font-extrabold uppercase leading-[1.02]">
              80 tok/s means
              <br />
              nothing without
              <br />
              <span className="text-accent">context.</span>
            </h2>
            <p className="mt-7 max-w-[46ch] text-[0.9375rem] leading-relaxed text-night-fog">
              Every benchmark graph you&rsquo;ve ever seen hides the same eight
              variables. Change any one of them and the number changes with it.
              A throughput figure without its configuration is not a result —
              it is a rumor with a decimal point.
            </p>
            <p
              className="mono mt-8 text-[0.6875rem] tracking-[0.2em] text-night-paper"
              data-reveal
            >
              ∴ MISSING FIELDS: <span className="text-accent">8 / 8</span>
            </p>
          </div>

          {/* exploded number */}
          <div className="relative mx-auto w-full max-w-[500px]">
            {/* desktop: exploded diagram */}
            <div className="relative hidden aspect-square sm:block">
              <svg aria-hidden className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {CHIPS.map((c) => (
                  <line
                    key={c.k}
                    x1="50"
                    y1="50"
                    x2={c.line[0]}
                    y2={c.line[1]}
                    stroke="#8b8373"
                    strokeOpacity="0.4"
                    strokeWidth="0.4"
                    strokeDasharray="1.6 1.6"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </svg>

              <div aria-hidden className="absolute left-1/2 top-0 h-full w-px bg-night-edge" />
              <div aria-hidden className="absolute left-0 top-1/2 h-px w-full bg-night-edge" />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center" data-reveal>
                  <span className="mono block text-[0.5625rem] tracking-[0.28em] text-night-fog">REPORTED VALUE</span>
                  <span className="font-disp strike-line clip-numeric block text-[clamp(4rem,11vw,7rem)] font-extrabold leading-none">
                    80
                  </span>
                  <span className="mono block text-[0.625rem] tracking-[0.3em] text-night-fog">TOK/S</span>
                </div>
              </div>

              {CHIPS.map((c, i) => (
                <div
                  key={c.k}
                  className="mono absolute border border-dashed border-night-fog/70 bg-night px-2.5 py-1.5 text-[0.625rem] tracking-[0.18em] text-night-fog"
                  style={
                    {
                      left: c.pos.left,
                      top: c.pos.top,
                      "--reveal-delay": `${200 + i * 90}ms`,
                    } as CSSProperties
                  }
                  data-reveal
                >
                  {c.k}: <span className="text-night-paper">?</span>
                </div>
              ))}
            </div>

            {/* mobile: recomposed as list */}
            <div className="sm:hidden">
              <div className="border border-night-edge p-6 text-center" data-reveal>
                <span className="mono block text-[0.5625rem] tracking-[0.28em] text-night-fog">REPORTED VALUE</span>
                <span className="font-disp strike-line block text-7xl font-extrabold leading-none">80</span>
                <span className="mono block text-[0.625rem] tracking-[0.3em] text-night-fog">TOK/S</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {CHIPS.map((c, i) => (
                  <div
                    key={c.k}
                    className="mono border border-dashed border-night-fog/70 px-2.5 py-1.5 text-[0.625rem] tracking-[0.18em] text-night-fog"
                    style={{ "--reveal-delay": `${120 + i * 70}ms` } as React.CSSProperties}
                    data-reveal
                  >
                    {c.k}: ?
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="mono mt-16 border-t border-night-edge pt-6 text-center text-[0.75rem] tracking-[0.24em] text-night-paper" data-reveal>
          A NUMBER WITHOUT CONFIGURATION IS NOT A BENCHMARK.
        </p>
      </div>
    </section>
  );
}

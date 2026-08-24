"use client";

import { useEffect, useRef, useState } from "react";
import { referenceRecord } from "../lib/data";
import { fmtNum } from "../lib/format";

type Phase = "BOOT" | "MEASURING" | "VALIDATING" | "VERIFIED";

/** Animated run readout for the hero instrument panel. */
export default function InstrumentPanel() {
  const rec = referenceRecord();
  if (!rec) return <div className="border border-night-edge bg-night-raise p-6 mono text-xs tracking-[0.16em] text-night-fog">NO MEASURED RUNS YET</div>;
  return <InstrumentPanelRun rec={rec} />;
}

function InstrumentPanelRun({ rec }: { rec: NonNullable<ReturnType<typeof referenceRecord>> }) {
  const [gen, setGen] = useState(0);
  const [prompt, setPrompt] = useState(0);
  const [phase, setPhase] = useState<Phase>("BOOT");
  const [genFill, setGenFill] = useState(0);
  const [promptFill, setPromptFill] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setGen(rec.generationTPS);
      setPrompt(rec.promptTPS);
      setGenFill(1);
      setPromptFill(1);
      setPhase("VERIFIED");
      return;
    }

    const D = 1900;
    let raf = 0;
    let t0 = 0;
    let validateTimer: ReturnType<typeof setTimeout>;

    const ease = (x: number) => 1 - Math.pow(1 - x, 3);

    const step = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min(1, (ts - t0) / D);
      const e = ease(p);
      setGen(rec.generationTPS * e);
      setPrompt(rec.promptTPS * e);
      setGenFill(e);
      setPromptFill(Math.min(1, e * 1.06));
      if (p < 1) {
        raf = requestAnimationFrame(step);
      } else {
        setPhase("VALIDATING");
        validateTimer = setTimeout(() => setPhase("VERIFIED"), 700);
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setPhase("MEASURING");
          io.disconnect();
          raf = requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (panelRef.current) io.observe(panelRef.current);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(validateTimer);
    };
  }, [rec]);

  return (
    <div
      ref={panelRef}
      className="scanlines border border-night-edge bg-night-raise text-night-paper"
    >
      {/* header */}
      <div className="flex items-center justify-between border-b border-night-edge px-4 py-2.5">
        <span className="mono text-[0.625rem] tracking-[0.22em] text-night-fog">
          REBENCH / RUN 000184
        </span>
        <span className="mono text-[0.625rem] tracking-[0.14em] text-night-fog">
          FIG.01
        </span>
      </div>

      {/* configuration */}
      <dl className="mono grid grid-cols-[auto_1fr] gap-x-6 px-4 pt-3 text-[0.6875rem]">
        {(
          [
            ["MODEL", rec.model.toUpperCase()],
            ["QUANT", rec.quantization],
            ["ENGINE", `${rec.engine.toUpperCase()} ${rec.engineVersion.toUpperCase()}`],
            ["GPU", `${rec.hardware} · ${rec.vram} GB`],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="py-[3px] tracking-[0.2em] text-night-fog">{k}</dt>
            <dd className="clip-numeric py-[3px] text-right">{v}</dd>
          </div>
        ))}
      </dl>

      {/* measurements */}
      <div className="mx-4 mt-3 border-t border-night-edge pt-3">
        <div className="mono text-[0.5625rem] tracking-[0.24em] text-night-fog">GENERATION</div>
        <div className="mt-1 flex items-baseline gap-3">
          <span className="font-disp clip-numeric text-4xl font-semibold leading-none">
            {fmtNum(gen, 1)}
          </span>
          <span className="mono text-[0.625rem] tracking-[0.18em] text-night-fog">TOK/S</span>
        </div>
        <div className="relative mt-2 h-[6px] bg-night-edge">
          <div
            className="absolute inset-y-0 left-0 bg-night-paper"
            style={{ width: `${genFill * 78}%` }}
          />
          <div className="absolute inset-y-0 left-[78%] w-px bg-night-fog/60" />
        </div>

        <div className="mono mt-4 text-[0.5625rem] tracking-[0.24em] text-night-fog">PROMPT</div>
        <div className="mt-1 flex items-baseline gap-3">
          <span className="font-disp clip-numeric text-4xl font-semibold leading-none">
            {fmtNum(prompt, 1)}
          </span>
          <span className="mono text-[0.625rem] tracking-[0.18em] text-night-fog">TOK/S</span>
        </div>
        <div className="relative mt-2 h-[6px] bg-night-edge">
          <div
            className="absolute inset-y-0 left-0 bg-night-paper"
            style={{ width: `${promptFill * 92}%` }}
          />
          <div className="absolute inset-y-0 left-[92%] w-px bg-night-fog/60" />
        </div>
      </div>

      {/* footer fields */}
      <dl className="mono grid grid-cols-[auto_1fr] gap-x-6 px-4 py-3 text-[0.6875rem]">
        <dt className="py-[3px] tracking-[0.2em] text-night-fog">TTFT</dt>
        <dd className="clip-numeric py-[3px] text-right">{rec.ttft} ms</dd>
        <dt className="py-[3px] tracking-[0.2em] text-night-fog">VERSION</dt>
        <dd className="clip-numeric py-[3px] text-right">{rec.benchmarkVersion}</dd>
        <dt className="py-[3px] tracking-[0.2em] text-night-fog">STATUS</dt>
        <dd className="py-[3px] text-right">
          {phase === "VERIFIED" ? (
            <span className="text-[#ff6a3d]">■ VERIFIED</span>
          ) : phase === "VALIDATING" ? (
            <span className="blink text-night-fog">□ VALIDATING</span>
          ) : (
            <span className="blink text-night-fog">□ {phase}</span>
          )}
        </dd>
      </dl>
    </div>
  );
}

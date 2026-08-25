"use client";

import { useEffect, useMemo, useState } from "react";

const TREE = [
  "ReBench/",
  "├── app/",
  "├── benchmark/",
  "│   ├── runner.py",
  "│   └── performance.json",
  "├── components/",
  "├── data/",
  "│   └── benchmarks.json",
  "├── results/",
  "│   └── {family}/",
  "├── schema/",
  "│   └── benchmark.schema.json",
  "├── scripts/",
  "└── README.md",
];

const HIGHLIGHTS = [8, 10, 6, 13]; // results/ → schema → index → README

export default function RepoTree() {
  const full = useMemo(() => TREE.join("\n"), []);
  const [chars, setChars] = useState(0);
  const [done, setDone] = useState(false);
  const [hl, setHl] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setChars(full.length);
      setDone(true);
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i = Math.min(i + 4, full.length);
      setChars(i);
      if (i >= full.length) {
        clearInterval(id);
        setDone(true);
      }
    }, 14);
    return () => clearInterval(id);
  }, [full]);

  useEffect(() => {
    if (!done) return;
    const id = setInterval(() => setHl((h) => (h + 1) % HIGHLIGHTS.length), 1500);
    return () => clearInterval(id);
  }, [done]);

  const shown = full.slice(0, chars).split("\n");

  return (
    <div className="scanlines relative overflow-hidden border border-night-edge bg-night-raise">
      <div className="flex items-center justify-between border-b border-night-edge px-4 py-2">
        <span className="mono text-[0.625rem] tracking-[0.22em] text-night-fog">
          github.com/Nilabh-code/ReBench
        </span>
        <span className="mono text-[0.625rem] tracking-[0.18em] text-night-fog">
          main · public
        </span>
      </div>
      <div className="mono min-h-[264px] whitespace-pre px-4 py-4 text-[0.75rem] leading-[1.9] text-night-paper sm:min-h-[296px] sm:text-[0.8125rem]">
        {shown.map((line, i) => {
          const active = done && HIGHLIGHTS[hl] === i;
          return (
            <div
              key={i}
              className={`-mx-2 flex items-center gap-2 px-2 transition-colors duration-150 ${
                active ? "bg-night-edge text-white" : ""
              }`}
            >
              <span aria-hidden className={active ? "text-accent" : "invisible"}>▸</span>
              <span>{line}</span>
              {active && line.includes("results/") ? (
                <span className="ml-auto text-[0.625rem] text-night-fog">awaiting first run</span>
              ) : null}
            </div>
          );
        })}
        {!done ? <span aria-hidden className="blink text-accent">▮</span> : <span className="text-night-fog">— end of tree —</span>}
      </div>
    </div>
  );
}

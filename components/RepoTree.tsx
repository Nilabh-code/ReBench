"use client";

import { useEffect, useMemo, useState } from "react";

const TREE = [
  "ReBench/",
  "├── benchmark/",
  "│   ├── runner/",
  "│   └── tests/",
  "├── results/",
  "│   ├── qwen/",
  "│   ├── llama/",
  "│   └── deepseek/",
  "├── schema/",
  "│   └── benchmark.schema.json",
  "├── data/",
  "│   └── benchmarks.json",
  "├── website/",
  "└── README.md",
];

const HIGHLIGHTS = [5, 9, 11, 4, 13]; // qwen/ → schema → index → results/ → README

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
      <pre className="mono min-h-[264px] px-4 py-4 text-[0.75rem] leading-[1.9] text-night-paper sm:min-h-[296px] sm:text-[0.8125rem]">
        {shown.map((line, i) => {
          const active = done && HIGHLIGHTS[hl] === i;
          return (
            <div
              key={i}
              className={`-mx-2 flex items-center gap-2 px-2 transition-colors duration-150 ${
                active ? "bg-night-edge text-white" : ""
              }`}
            >
              {active ? <span className="text-accent">▸</span> : <span className="text-transparent">▸</span>}
              <span>{line}</span>
              {active && line.includes("qwen/") ? (
                <span className="ml-auto text-[0.625rem] text-night-fog">184 files</span>
              ) : null}
            </div>
          );
        })}
        {!done ? <span className="blink text-accent">▮</span> : <span className="text-night-fog">— end of tree —</span>}
      </pre>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { BenchmarkRecord } from "../lib/types";
import { fmtNum } from "../lib/format";
import { StatusBadge, DemoTag } from "./ui";

type SortKey = "model" | "quant" | "hardware" | "engine" | "gen" | "prompt" | "ttft" | "score" | "date";

interface Props {
  rows: BenchmarkRecord[];
  limit?: number;
  csv?: boolean;
}

const COLS: { key: SortKey | null; label: string; num?: boolean }[] = [
  { key: "model", label: "MODEL" },
  { key: "quant", label: "QUANT" },
  { key: "hardware", label: "HARDWARE" },
  { key: "engine", label: "ENGINE" },
  { key: "gen", label: "GEN TOK/S", num: true },
  { key: "prompt", label: "PROMPT TOK/S", num: true },
  { key: "ttft", label: "TTFT", num: true },
  { key: "score", label: "SCORE", num: true },
  { key: null, label: "STATUS" },
];

function value(r: BenchmarkRecord, k: SortKey): string | number {
  switch (k) {
    case "model": return r.model;
    case "quant": return r.quantization;
    case "hardware": return r.hardware;
    case "engine": return r.engine;
    case "gen": return r.generationTPS;
    case "prompt": return r.promptTPS;
    case "ttft": return r.ttft;
    case "score": return r.score;
    case "date": return r.timestamp;
  }
}

function uniq(rows: BenchmarkRecord[], f: (r: BenchmarkRecord) => string): string[] {
  return [...new Set(rows.map(f))].sort();
}

/** Characters that make Excel/LibreOffice treat a cell as a formula, even inside quotes. */
const CSV_FORMULA_TRIGGER = /^[=+\-@\t\r]/;

function csvCell(v: unknown): string {
  const s = String(v);
  // Leading apostrophe forces the spreadsheet to read the cell as text, so a
  // contributor-submitted "=HYPERLINK(...)" cannot execute in someone's Excel.
  const safe = CSV_FORMULA_TRIGGER.test(s) ? `'${s}` : s;
  return `"${safe.replaceAll('"', '""')}"`;
}

export default function BenchmarkTable({ rows, limit, csv }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [fModel, setFModel] = useState("");
  const [fHardware, setFHardware] = useState("");
  const [fQuant, setFQuant] = useState("");
  const [fEngine, setFEngine] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("gen");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [epoch, setEpoch] = useState(0);

  const set = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setEpoch((e) => e + 1);
  };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = rows.filter(
      (r) =>
        (!fModel || r.model === fModel) &&
        (!fHardware || r.hardware === fHardware) &&
        (!fQuant || r.quantization === fQuant) &&
        (!fEngine || r.engine === fEngine) &&
        (!fStatus || r.status === fStatus) &&
        (!needle ||
          `${r.id} ${r.model} ${r.quantization} ${r.hardware} ${r.engine} ${r.contributor}`
            .toLowerCase()
            .includes(needle))
    );
    out = out.sort((a, b) => {
      const va = value(a, sortKey);
      const vb = value(b, sortKey);
      const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
      return cmp * sortDir;
    });
    return limit ? out.slice(0, limit) : out;
  }, [rows, q, fModel, fHardware, fQuant, fEngine, fStatus, sortKey, sortDir, limit]);

  const clickSort = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(k);
      setSortDir(k === "ttft" ? 1 : -1);
    }
    setEpoch((e) => e + 1);
  };

  const exportCsv = () => {
    const head = ["id", "model", "quantization", "hardware", "engine", "engine_version", "prompt_tokens", "generated_tokens", "prompt_tps", "generation_tps", "ttft_ms", "score", "status"];
    const lines = filtered.map((r) =>
      [r.id, r.model, r.quantization, r.hardware, r.engine, r.engineVersion, r.promptTokens, r.generatedTokens, r.promptTPS, r.generationTPS, r.ttft, r.score, r.status]
        .map(csvCell)
        .join(",")
    );
    const blob = new Blob([head.join(",") + "\n" + lines.join("\n") + "\n"], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rebench-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const openRun = (id: string) => router.push(`/runs/${id}`);

  const selectCls =
    "mono border border-ink/40 bg-paper px-2.5 py-2 text-[0.6875rem] tracking-[0.1em] text-ink focus:border-accent";

  return (
    <div>
      {/* controls */}
      <div className="flex flex-wrap items-center gap-3 border border-ink/30 bg-paper-dim/70 p-3">
        <label className="relative flex-1 basis-56">
          <span className="sr-only">Search runs</span>
          <span aria-hidden className="mono pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[0.6875rem] text-stone">⌕</span>
          <input
            type="search"
            value={q}
            onChange={(e) => set(setQ)(e.target.value)}
            placeholder="SEARCH RUN, MODEL, HARDWARE…"
            className={`w-full pl-8 ${selectCls}`}
          />
        </label>

        <select aria-label="Filter by model" className={selectCls} value={fModel} onChange={(e) => set(setFModel)(e.target.value)}>
          <option value="">MODEL: ALL</option>
          {uniq(rows, (r) => r.model).map((m) => (
            <option key={m} value={m}>{m.toUpperCase()}</option>
          ))}
        </select>

        <select aria-label="Filter by hardware" className={selectCls} value={fHardware} onChange={(e) => set(setFHardware)(e.target.value)}>
          <option value="">HARDWARE: ALL</option>
          {uniq(rows, (r) => r.hardware).map((m) => (
            <option key={m} value={m}>{m.toUpperCase()}</option>
          ))}
        </select>

        <select aria-label="Filter by quantization" className={selectCls} value={fQuant} onChange={(e) => set(setFQuant)(e.target.value)}>
          <option value="">QUANT: ALL</option>
          {uniq(rows, (r) => r.quantization).map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <select aria-label="Filter by engine" className={`${selectCls} hidden sm:block`} value={fEngine} onChange={(e) => set(setFEngine)(e.target.value)}>
          <option value="">ENGINE: ALL</option>
          {uniq(rows, (r) => r.engine).map((m) => (
            <option key={m} value={m}>{m.toUpperCase()}</option>
          ))}
        </select>

        <select aria-label="Filter by status" className={selectCls} value={fStatus} onChange={(e) => set(setFStatus)(e.target.value)}>
          <option value="">STATUS: ALL</option>
          {["VERIFIED", "REPRODUCED", "PENDING"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {csv ? (
          <button onClick={exportCsv} className="btn btn-line !px-3 !py-2 ml-auto">
            EXPORT CSV
          </button>
        ) : null}
      </div>

      {/* result count */}
      <div className="mono mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.625rem] tracking-[0.18em] text-stone">
        <span>
          {filtered.length} / {rows.length} RUNS
        </span>
        <span aria-hidden>·</span>
        <span>SORT: {COLS.find((c) => c.key === sortKey)?.label} {sortDir === -1 ? "↓" : "↑"}</span>
        <span aria-hidden>·</span>
        <DemoTag />
      </div>

      {/* desktop table */}
      <div className="mt-3 hidden overflow-x-auto md:block">
        <table className="bench-table">
          <thead>
            <tr>
              {COLS.map((c) => (
                <th key={c.label} className={c.num ? "num" : ""}>
                  {c.key ? (
                    <button
                      onClick={() => clickSort(c.key as SortKey)}
                      className={`inline-flex items-center gap-1 uppercase tracking-[0.16em] hover:text-accent ${
                        sortKey === c.key ? "text-accent" : ""
                      }`}
                    >
                      {c.label}
                      <span aria-hidden>{sortKey === c.key ? (sortDir === -1 ? "▼" : "▲") : "△"}</span>
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody key={epoch}>
            {filtered.map((r, i) => (
              <tr
                key={r.id}
                onClick={() => openRun(r.id)}
                className="row-anim cursor-pointer"
                style={{ animationDelay: `${Math.min(i, 14) * 24}ms` }}
              >
                <td>
                  <Link
                    href={`/runs/${r.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="hover:text-accent"
                  >
                    <span className="block font-medium text-ink">{r.model}</span>
                    <span className="mt-0.5 block text-[0.625rem] text-stone">{r.id}</span>
                  </Link>
                </td>
                <td>{r.quantization}</td>
                <td className="text-graphite">{r.hardware}</td>
                <td className="text-graphite">{r.engine}</td>
                <td className="num font-semibold text-ink">{fmtNum(r.generationTPS, 1)}</td>
                <td className="num">{fmtNum(r.promptTPS, 1)}</td>
                <td className="num">{r.ttft} ms</td>
                <td className="num">
                  <span className="inline-flex items-center justify-end gap-2">
                    <span aria-hidden className="bar-track inline-block w-10">
                      <span className="bar-fill" style={{ "--fill": r.score / 100 } as React.CSSProperties} />
                    </span>
                    {fmtNum(r.score, 1)}
                  </span>
                </td>
                <td>{<StatusBadge status={r.status} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className="mono border border-dashed border-ink/40 p-6 text-center text-[0.6875rem] tracking-[0.2em] text-stone">
            NO RUNS MATCH — WIDEN THE FILTERS
          </p>
        ) : null}
      </div>

      {/* mobile cards */}
      <ul className="mt-3 space-y-3 md:hidden" key={`m${epoch}`}>
        {filtered.map((r, i) => (
          <li key={r.id} className="row-anim border border-ink/40 bg-paper p-4" style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}>
            <Link href={`/runs/${r.id}`} className="flex items-baseline justify-between gap-3">
              <span className="font-disp text-lg font-bold">{r.model}</span>
              <StatusBadge status={r.status} />
            </Link>
            <p className="mono mt-1 text-[0.625rem] tracking-[0.12em] text-stone">
              {r.id} · {r.quantization} · {r.hardware}
            </p>
            <div className="mono mt-3 grid grid-cols-3 gap-2 border-t border-ink/15 pt-3 text-center">
              <div>
                <span className="block text-[0.5625rem] tracking-[0.18em] text-stone">GEN</span>
                <span className="clip-numeric text-base font-semibold">{fmtNum(r.generationTPS, 1)}</span>
              </div>
              <div>
                <span className="block text-[0.5625rem] tracking-[0.18em] text-stone">PROMPT</span>
                <span className="clip-numeric text-base font-semibold">{fmtNum(r.promptTPS, 1)}</span>
              </div>
              <div>
                <span className="block text-[0.5625rem] tracking-[0.18em] text-stone">TTFT</span>
                <span className="clip-numeric text-base font-semibold">{r.ttft} ms</span>
              </div>
            </div>
          </li>
        ))}
        {filtered.length === 0 ? (
          <li className="mono border border-dashed border-ink/40 p-6 text-center text-[0.6875rem] tracking-[0.2em] text-stone">
            NO RUNS MATCH — WIDEN THE FILTERS
          </li>
        ) : null}
      </ul>
    </div>
  );
}

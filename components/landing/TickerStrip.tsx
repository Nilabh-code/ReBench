import { latestRecords } from "../../lib/data";

export default function TickerStrip() {
  const runs = latestRecords(9);
  const items = runs.map(
    (r) =>
      `${r.id} · ${r.model.toUpperCase()} · ${r.quantization} · ${r.hardware.toUpperCase()} · ${r.generationTPS.toFixed(1)} TOK/S · ${r.status}`
  );
  const row = items.join("   //   ");
  return (
    <div className="mono overflow-hidden border-b border-ink/25 bg-ink py-2 text-[0.625rem] tracking-[0.16em] text-paper/90" aria-label="Latest benchmark runs">
      <div className="marquee-track whitespace-nowrap">
        {[0, 1].map((i) => (
          <span key={i} aria-hidden={i === 1} className="px-6">
            {row}
            <span className="text-accent">{"   //   "}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

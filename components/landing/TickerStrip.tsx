import { latestRecords } from "../../lib/data";

export default function TickerStrip() {
  const runs = latestRecords(9);
  const items = runs.map(
    (r) =>
      `${r.id} · ${r.model.toUpperCase()} · ${r.quantization} · ${r.hardware.toUpperCase()} · ${r.generationTPS.toFixed(1)} TOK/S · ${r.status}`
  );
  const row = items.join("   //   ");

  if (!row) {
    return (
      <p className="mono border-b border-ink/25 bg-ink px-6 py-2 text-center text-[0.625rem] tracking-[0.16em] text-paper/90">
        AWAITING FIRST MEASURED RUN · THE STRIP POPULATES FROM results/
      </p>
    );
  }

  return (
    <section
      className="mono overflow-hidden border-b border-ink/25 bg-ink py-2 text-[0.625rem] tracking-[0.16em] text-paper/90"
      aria-label="Latest benchmark runs"
    >
      <div className="marquee-track whitespace-nowrap">
        {[0, 1].map((i) => (
          <span key={i} {...(i === 1 ? { "aria-hidden": true } : {})} className="px-6">
            {row}
            <span aria-hidden className="text-accent">{"   //   "}</span>
          </span>
        ))}
      </div>
    </section>
  );
}

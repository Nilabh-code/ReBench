import type { BenchmarkStatus } from "../lib/types";

export function SectionHead({
  no,
  title,
  note,
  night = false,
}: {
  no: string;
  title: string;
  note?: string;
  night?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline gap-4 border-b pb-3 ${
        night ? "border-night-edge" : "border-ink/25"
      }`}
    >
      <span className={`mono text-[0.6875rem] tracking-[0.18em] ${night ? "text-night-fog" : "text-stone"}`}>
        {no}
      </span>
      <p className="mono text-[0.6875rem] font-semibold uppercase tracking-[0.22em] sm:text-xs">
        {title}
      </p>
      {note ? (
        <span className={`mono ml-auto hidden text-[0.625rem] tracking-[0.14em] sm:block ${night ? "text-night-fog" : "text-stone"}`}>
          {note}
        </span>
      ) : null}
    </div>
  );
}

export function PageHead({
  crumb,
  title,
  desc,
}: {
  crumb: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="paper-grid border-b border-ink/25">
      <div className="mx-auto w-full max-w-page px-6 pb-12 pt-14 md:px-10 lg:pb-16 lg:pt-20">
        <p className="mono text-[0.625rem] tracking-[0.26em] text-stone" data-reveal>
          REBENCH <span aria-hidden>{"//"}</span> {crumb}
        </p>
        <h1
          className="font-disp mt-5 text-[clamp(2.2rem,5vw,4.2rem)] font-extrabold uppercase leading-[1.0]"
          data-reveal
          style={{ "--reveal-delay": "80ms" } as React.CSSProperties}
        >
          {title}
        </h1>
        {desc ? (
          <p
            className="mt-5 max-w-[62ch] text-[0.9375rem] leading-relaxed text-graphite"
            data-reveal
            style={{ "--reveal-delay": "160ms" } as React.CSSProperties}
          >
            {desc}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: BenchmarkStatus }) {
  const map = {
    VERIFIED: "text-accent",
    REPRODUCED: "text-ink",
    PENDING: "text-stone",
  } as const;
  return (
    <span className={`mono inline-flex items-center gap-2 text-[0.6875rem] tracking-[0.16em] ${map[status]}`}>
      <span className={`dot ${status === "VERIFIED" ? "bg-accent" : status === "REPRODUCED" ? "bg-current" : ""}`} />
      {status}
    </span>
  );
}

export function DemoTag({ light = false }: { light?: boolean }) {
  return (
    <span
      className={`mono inline-block border px-2 py-0.5 text-[0.5625rem] tracking-[0.22em] ${
        light ? "border-night-paper/50 text-night-paper/80" : "border-accent/60 text-accent"
      }`}
    >
      REAL INDEX
    </span>
  );
}

export function CornerMarks({ light = false }: { light?: boolean }) {
  const c = light ? "text-night-paper/50" : "text-stone";
  return (
    <>
      <span aria-hidden className={`plus-mark absolute -left-[5px] -top-[9px] text-xs ${c}`}>+</span>
      <span aria-hidden className={`plus-mark absolute -right-[5px] -top-[9px] text-xs ${c}`}>+</span>
      <span aria-hidden className={`plus-mark absolute -bottom-[9px] -left-[5px] text-xs ${c}`}>+</span>
      <span aria-hidden className={`plus-mark absolute -bottom-[9px] -right-[5px] text-xs ${c}`}>+</span>
    </>
  );
}

export function FigLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`mono text-[0.5625rem] tracking-[0.2em] text-stone ${className}`}>
      {children}
    </span>
  );
}

export function KV({
  k,
  v,
  mono = true,
  light = false,
}: {
  k: string;
  v: React.ReactNode;
  mono?: boolean;
  light?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 border-b py-[7px] text-[0.75rem] ${
        light ? "border-night-edge" : "border-ink/15"
      }`}
    >
      <span className={`mono text-[0.625rem] uppercase tracking-[0.18em] ${light ? "text-night-fog" : "text-stone"}`}>
        {k}
      </span>
      <span className={mono ? "mono clip-numeric text-right" : "text-right"}>{v}</span>
    </div>
  );
}

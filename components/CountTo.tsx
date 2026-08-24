"use client";

import { useEffect, useRef, useState } from "react";
import { fmtInt } from "../lib/format";

export default function CountTo({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setN(value);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || started.current) return;
        started.current = true;
        const D = 1300;
        let t0 = 0;
        const ease = (x: number) => 1 - Math.pow(1 - x, 3);
        const step = (ts: number) => {
          if (!t0) t0 = ts;
          const p = Math.min(1, (ts - t0) / D);
          setN(Math.round(value * ease(p)));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        io.disconnect();
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value]);

  return (
    <span ref={ref} className="clip-numeric">
      {fmtInt(n)}
      {suffix}
    </span>
  );
}

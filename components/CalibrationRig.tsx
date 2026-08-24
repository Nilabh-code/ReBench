"use client";

import { useEffect, useRef, useState } from "react";

/** Static technical illustration used while loading, or when WebGL is unavailable. */
function RigFallback({ hidden }: { hidden?: boolean }) {
  return (
    <svg
      viewBox="0 0 360 340"
      aria-hidden
      className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${hidden ? "opacity-0" : "opacity-100"}`}
    >
      {/* datum grid */}
      <g stroke="#8b8373" strokeOpacity="0.28" strokeWidth="0.75">
        {Array.from({ length: 9 }, (_, i) => (
          <line key={`v${i}`} x1={180 + (i - 4) * 36} y1={252} x2={180 + (i - 4) * 18} y2={296} />
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <line key={`h${i}`} x1={180 - 150 + i * 8} y1={252 + i * 5} x2={180 + 150 - i * 8} y2={252 + i * 5} />
        ))}
      </g>
      {/* calibration dial */}
      <ellipse cx="180" cy="274" rx="128" ry="26" fill="none" stroke="#8b8373" strokeWidth="1" />
      {Array.from({ length: 48 }, (_, i) => {
        const a = (i / 48) * Math.PI * 2;
        const major = i % 4 === 0;
        const x0 = 180 + Math.cos(a) * 128;
        const y0 = 274 + Math.sin(a) * 26;
        const x1 = 180 + Math.cos(a) * (128 - (major ? 12 : 6));
        const y1 = 274 + Math.sin(a) * (26 - (major ? 2.6 : 1.3));
        return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke={major ? "#e8e2d2" : "#8b8373"} strokeWidth={major ? 1.2 : 0.8} />;
      })}
      {/* index marker */}
      <path d="M312 274 l10 -5 v10 z" fill="#d53a0c" />
      {/* stacked plates */}
      {[
        { w: 118, y: 232, h: 12 },
        { w: 100, y: 200, h: 12 },
        { w: 82, y: 168, h: 12 },
        { w: 64, y: 136, h: 12 },
      ].map((p, i) => (
        <g key={i}>
          <polygon
            points={`${180 - p.w},${p.y} 180,${p.y - 16} ${180 + p.w},${p.y} 180,${p.y + 16}`}
            fill="#2c2820"
            stroke="#e8e2d2"
            strokeWidth="1.1"
          />
          <polygon
            points={`${180 - p.w},${p.y} 180,${p.y + 16} ${180 + p.w},${p.y} ${180 + p.w},${p.y + p.h} 180,${p.y + 16 + p.h} ${180 - p.w},${p.y + p.h}`}
            fill="#1d1a16"
            stroke="#e8e2d2"
            strokeOpacity="0.55"
            strokeWidth="0.9"
          />
        </g>
      ))}
      {/* axis + graduations */}
      <line x1="180" y1="96" x2="180" y2="268" stroke="#e8e2d2" strokeWidth="1.2" />
      {Array.from({ length: 12 }, (_, i) => (
        <line key={i} x1="180" y1={104 + i * 14} x2={180 + (i % 3 === 0 ? 14 : 7)} y2={104 + i * 14} stroke="#e8e2d2" strokeOpacity="0.75" strokeWidth="0.9" />
      ))}
      {/* scan plane */}
      <ellipse cx="180" cy="186" rx="96" ry="18" fill="#d53a0c" fillOpacity="0.12" stroke="#d53a0c" strokeWidth="1.1" />
      {/* labels */}
      <g fill="#8b8373" fontFamily="IBM Plex Mono, monospace" fontSize="8" letterSpacing="1.5">
        <text x="292" y="140">MODEL</text>
        <text x="296" y="172">QUANT</text>
        <text x="300" y="204">ENGINE</text>
        <text x="306" y="236">GPU</text>
      </g>
      <g stroke="#8b8373" strokeOpacity="0.6" strokeWidth="0.75">
        <line x1="216" y1="132" x2="290" y2="136" />
        <line x1="224" y1="164" x2="294" y2="168" />
        <line x1="232" y1="196" x2="298" y2="200" />
        <line x1="240" y1="228" x2="304" y2="232" />
      </g>
    </svg>
  );
}

export default function CalibrationRig({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    // WebGL probe
    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2") ?? probe.getContext("webgl");
    if (!gl) return; // fallback stays visible

    import("./three/RigScene")
      .then(({ initRig }) => {
        if (cancelled || !canvasRef.current) return;
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        cleanup = initRig(canvas, reduced);
        setReady(true);
      })
      .catch(() => {
        /* keep the SVG fallback */
      });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <div className={`relative ${className}`} aria-hidden>
      <RigFallback hidden={ready} />
      <canvas ref={canvasRef} className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`} />
    </div>
  );
}

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "rgb(var(--paper) / <alpha-value>)",
        "paper-dim": "rgb(var(--paper-dim) / <alpha-value>)",
        "paper-dark": "rgb(var(--paper-dark) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        "ink-soft": "rgb(var(--ink-soft) / <alpha-value>)",
        graphite: "rgb(var(--graphite) / <alpha-value>)",
        // Tokens resolve per-theme from app/globals.css (:root / [data-theme="dark"]).
        stone: "rgb(var(--stone) / <alpha-value>)",
        "stone-l": "rgb(var(--stone-l) / <alpha-value>)",
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          deep: "rgb(var(--accent-deep) / <alpha-value>)",
        },
        night: {
          DEFAULT: "rgb(var(--night) / <alpha-value>)",
          raise: "rgb(var(--night-raise) / <alpha-value>)",
          edge: "rgb(var(--night-edge) / <alpha-value>)",
          fog: "rgb(var(--night-fog) / <alpha-value>)",
          paper: "rgb(var(--night-paper) / <alpha-value>)",
        },
      },
      fontFamily: {
        grotesk: ["var(--font-grotesk)", "Helvetica Neue", "Arial", "sans-serif"],
        mono: ["var(--font-mono)", "IBM Plex Mono", "SFMono-Regular", "Menlo", "monospace"],
      },
      letterSpacing: {
        label: "0.18em",
      },
      maxWidth: {
        page: "84rem",
      },
      keyframes: {
        blink: {
          "0%, 55%": { opacity: "1" },
          "56%, 100%": { opacity: "0" },
        },
        "dash-flow": {
          to: { strokeDashoffset: "-24" },
        },
        "packet-y": {
          "0%": { top: "0%", opacity: "0" },
          "6%": { opacity: "1" },
          "94%": { opacity: "1" },
          "100%": { top: "100%", opacity: "0" },
        },
        "node-pulse": {
          "0%, 100%": { opacity: "0.2" },
          "50%": { opacity: "1" },
        },
        "sweep-x": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "row-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        blink: "blink 1.1s step-end infinite",
        "dash-flow": "dash-flow 1.2s linear infinite",
        "packet-y": "packet-y 7s linear infinite",
        "node-pulse": "node-pulse 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

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
        paper: "#F1EDE2",
        "paper-dim": "#E7E2D4",
        "paper-dark": "#DDD6C3",
        ink: "#161310",
        "ink-soft": "#2C2820",
        graphite: "#4A443A",
        // Keep in sync with --stone in app/globals.css (WCAG AA on --paper).
        stone: "#686256",
        "stone-l": "#B8B09E",
        accent: {
          DEFAULT: "#D53A0C",
          deep: "#A82C06",
        },
        night: {
          DEFAULT: "#141210",
          raise: "#1D1A16",
          edge: "#2E2A23",
          fog: "#93897A",
          paper: "#E8E2D2",
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

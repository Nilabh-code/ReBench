"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("rebench-theme", theme);
  } catch {
    // storage unavailable (private mode) — session-only preference.
  }
}

export default function ThemeToggle({
  variant = "link",
}: {
  variant?: "link" | "button";
}) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  const toggle = () => {
    if (!theme) return;
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  const label = theme === null ? "MODE" : theme === "dark" ? "DARK ☾" : "LIGHT ☀";
  const ariaLabel =
    theme === null
      ? "Toggle color theme"
      : theme === "dark"
        ? "Switch to light mode"
        : "Switch to dark mode";

  if (variant === "button") {
    return (
      <button onClick={toggle} aria-label={ariaLabel} className="btn btn-line justify-center">
        {label}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      aria-label={ariaLabel}
      className="mono text-[0.6875rem] tracking-[0.18em] text-graphite hover:text-accent"
    >
      {label}
    </button>
  );
}

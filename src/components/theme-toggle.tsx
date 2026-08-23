"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
  localStorage.setItem("mulsetu-theme", theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = localStorage.getItem("mulsetu-theme");
    const next: Theme = stored === "dark" ? "dark" : "light";
    setTheme(next);
    applyTheme(next);
  }, []);

  function choose(next: Theme) {
    setTheme(next);
    applyTheme(next);
  }

  return (
    <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-900">
      <button
        type="button"
        onClick={() => choose("light")}
        className={`h-8 rounded-md px-2.5 text-xs font-medium ${
          theme === "light" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
        }`}
        aria-pressed={theme === "light"}
      >
        Light
      </button>
      <button
        type="button"
        onClick={() => choose("dark")}
        className={`h-8 rounded-md px-2.5 text-xs font-medium ${
          theme === "dark" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
        }`}
        aria-pressed={theme === "dark"}
      >
        Dark
      </button>
    </div>
  );
}

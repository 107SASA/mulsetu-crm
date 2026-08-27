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
    <div className="inline-flex shrink-0 rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-900">
      <button
        type="button"
        onClick={() => choose("light")}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-xs font-medium sm:h-8 sm:w-auto sm:px-2.5 ${
          theme === "light" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
        }`}
        aria-pressed={theme === "light"}
        aria-label="Light mode"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 sm:hidden" aria-hidden>
          <path d="M10 3.5a.75.75 0 0 1 .75.75v1.25a.75.75 0 0 1-1.5 0V4.25A.75.75 0 0 1 10 3.5Zm0 10.5a.75.75 0 0 1 .75.75v1.25a.75.75 0 0 1-1.5 0V14.75A.75.75 0 0 1 10 14Zm6.5-4a.75.75 0 0 1-.75.75h-1.25a.75.75 0 0 1 0-1.5H15.75A.75.75 0 0 1 16.5 10Zm-10.5 0a.75.75 0 0 1-.75.75H4.25a.75.75 0 0 1 0-1.5H5.25A.75.75 0 0 1 6 10Zm8.836-4.336a.75.75 0 0 1 0 1.06l-.884.884a.75.75 0 1 1-1.06-1.06l.884-.884a.75.75 0 0 1 1.06 0Zm-8.192 8.192a.75.75 0 0 1 0 1.06l-.884.884a.75.75 0 1 1-1.06-1.06l.884-.884a.75.75 0 0 1 1.06 0Zm8.192 1.944a.75.75 0 0 1-1.06 0l-.884-.884a.75.75 0 1 1 1.06-1.06l.884.884a.75.75 0 0 1 0 1.06ZM6.58 6.724a.75.75 0 0 1-1.06 0l-.884-.884a.75.75 0 0 1 1.06-1.06l.884.884a.75.75 0 0 1 0 1.06ZM10 7.25a2.75 2.75 0 1 0 0 5.5 2.75 2.75 0 0 0 0-5.5Z" />
        </svg>
        <span className="hidden sm:inline">Light</span>
      </button>
      <button
        type="button"
        onClick={() => choose("dark")}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-xs font-medium sm:h-8 sm:w-auto sm:px-2.5 ${
          theme === "dark" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
        }`}
        aria-pressed={theme === "dark"}
        aria-label="Dark mode"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 sm:hidden" aria-hidden>
          <path
            fillRule="evenodd"
            d="M7.455 3.104A7.25 7.25 0 0 0 14.75 13.4 7.25 7.25 0 1 1 7.455 3.104Zm1.12 1.437A5.75 5.75 0 1 0 15.46 11.43 7.25 7.25 0 0 1 8.575 4.54Z"
            clipRule="evenodd"
          />
        </svg>
        <span className="hidden sm:inline">Dark</span>
      </button>
    </div>
  );
}

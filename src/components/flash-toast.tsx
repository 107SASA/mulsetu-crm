"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

function clearNotice() {
  const url = new URL(window.location.href);
  url.searchParams.delete("notice");
  window.history.replaceState(null, "", url.pathname + url.search + url.hash);
}

// Shows the `?notice=` message that server actions attach to their redirect
// ("Changes saved", "Task added", …). After a few seconds it strips the param
// from the URL, which hides the toast and keeps reloads/shared links clean.
export function FlashToast() {
  const notice = useSearchParams().get("notice");

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(clearNotice, 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  if (!notice) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-50 flex justify-center px-4">
      <div
        role="status"
        className="toast-in pointer-events-auto flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg dark:bg-white dark:text-zinc-900"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-emerald-400 dark:text-emerald-600" aria-hidden>
          <path
            fillRule="evenodd"
            d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.58l7.3-7.3a1 1 0 0 1 1.4 0Z"
            clipRule="evenodd"
          />
        </svg>
        {notice}
        <button
          type="button"
          onClick={clearNotice}
          className="ml-1 rounded p-0.5 opacity-60 hover:opacity-100"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

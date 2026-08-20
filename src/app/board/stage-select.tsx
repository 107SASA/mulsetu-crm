"use client";

import { useState, useTransition } from "react";
import { STAGE_OPTIONS } from "@/lib/constants";
import type { Enums } from "@/lib/supabase/database.types";
import { moveProjectStage } from "./actions";

export function StageSelect({
  projectId,
  currentStage,
}: {
  projectId: string;
  currentStage: Enums<"project_stage">;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
      <select
        value={currentStage}
        disabled={isPending}
        onChange={(e) => {
          const newStage = e.target.value;
          setError(null);
          startTransition(async () => {
            const result = await moveProjectStage(projectId, newStage);
            if (result?.error) setError(result.error);
          });
        }}
        className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-700 transition-shadow focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/30 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      >
        {STAGE_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            Move to: {s.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

"use client";

import { STAGE_OPTIONS } from "@/lib/constants";
import type { Enums } from "@/lib/supabase/database.types";

// Compact "Move to…" picker on a pipeline card — the touch-friendly
// alternative to drag and drop. The board owns the optimistic state.
export function StageSelect({
  currentStage,
  onMove,
}: {
  currentStage: Enums<"project_stage">;
  onMove: (stage: Enums<"project_stage">) => void;
}) {
  return (
    <div onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
      <select
        value=""
        onChange={(e) => {
          if (e.target.value) onMove(e.target.value as Enums<"project_stage">);
        }}
        aria-label="Move to stage"
        className="w-full cursor-pointer rounded-md bg-transparent py-0.5 text-xs text-zinc-500 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-accent-500/30 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <option value="">Move to…</option>
        {STAGE_OPTIONS.filter((s) => s.value !== currentStage).map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}

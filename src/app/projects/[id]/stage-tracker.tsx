"use client";

import { useOptimistic, useState, useTransition } from "react";
import { STAGE_OPTIONS } from "@/lib/constants";
import type { Enums } from "@/lib/supabase/database.types";
import { moveProjectStage } from "@/app/board/actions";
import { Spinner } from "@/components/ui/spinner";

type Stage = Enums<"project_stage">;

const FLOW = STAGE_OPTIONS.filter((s) => s.value !== "on_hold_cancelled");

// Shows where the project is in the pipeline. Admins click a step to move it
// there (the change shows instantly and syncs with the Pipeline board).
export function StageTracker({ projectId, stage, canEdit }: { projectId: string; stage: Stage; canEdit: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [current, setOptimisticStage] = useOptimistic(stage);
  const onHold = current === "on_hold_cancelled";
  const currentIndex = FLOW.findIndex((s) => s.value === current);

  function move(next: Stage) {
    if (!canEdit || next === current) return;
    setError(null);
    startTransition(async () => {
      setOptimisticStage(next);
      const result = await moveProjectStage(projectId, next);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Progress {isPending && <Spinner className="ml-1 inline h-3 w-3 align-[-1px]" />}
        </p>
        {canEdit && (
          <button
            type="button"
            onClick={() => move(onHold ? "in_progress" : "on_hold_cancelled")}
            disabled={isPending}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {onHold ? "Resume project" : "Put on hold"}
          </button>
        )}
      </div>

      {onHold && (
        <p className="mb-2 rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          This project is on hold.
        </p>
      )}

      <ol className={`flex gap-1 ${onHold ? "opacity-50" : ""}`}>
        {FLOW.map((step, index) => {
          const done = !onHold && index < currentIndex;
          const active = !onHold && index === currentIndex;
          return (
            <li key={step.value} className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => move(step.value)}
                disabled={!canEdit || isPending}
                aria-current={active ? "step" : undefined}
                title={canEdit ? `Move to ${step.label}` : step.label}
                className={`group w-full py-2 text-left sm:py-0 ${canEdit ? "cursor-pointer" : "cursor-default"}`}
              >
                <span
                  className={`block h-1.5 rounded-full transition-colors ${
                    done || active ? "bg-accent-600" : "bg-zinc-200 dark:bg-zinc-800"
                  } ${canEdit && !active ? "group-hover:bg-accent-300 dark:group-hover:bg-accent-700" : ""}`}
                />
                <span
                  className={`mt-1.5 hidden truncate text-xs sm:block ${
                    active
                      ? "font-semibold text-accent-700 dark:text-accent-500"
                      : done
                        ? "text-zinc-700 dark:text-zinc-300"
                        : "text-zinc-400"
                  }`}
                >
                  {step.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      {!onHold && currentIndex >= 0 && (
        <p className="mt-1 text-sm font-medium text-accent-700 sm:hidden dark:text-accent-500">
          {FLOW[currentIndex].label}
          <span className="font-normal text-zinc-400">
            {" "}
            · step {currentIndex + 1} of {FLOW.length}
            {canEdit && " · tap a bar to move"}
          </span>
        </p>
      )}
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

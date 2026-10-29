"use client";

import { useOptimistic, useState, useTransition } from "react";
import { TASK_STATUS_OPTIONS } from "@/lib/constants";
import type { Enums } from "@/lib/supabase/database.types";
import { updateTaskStatus } from "@/app/tasks/actions";
import { Spinner } from "@/components/ui/spinner";

export function TaskStatusSelect({
  taskId,
  currentStatus,
}: {
  taskId: string;
  currentStatus: Enums<"task_status">;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Show the picked status right away; it settles to the server value (or
  // reverts on error) once the action finishes.
  const [status, setOptimisticStatus] = useOptimistic(currentStatus);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-1.5">
        {isPending && <Spinner className="h-3.5 w-3.5 text-zinc-400" />}
        <select
          value={status}
          disabled={isPending}
          aria-label="Task status"
          onChange={(e) => {
            const next = e.target.value as Enums<"task_status">;
            setError(null);
            startTransition(async () => {
              setOptimisticStatus(next);
              const result = await updateTaskStatus(taskId, next);
              if (result?.error) setError(result.error);
            });
          }}
          className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700 transition-shadow focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/30 disabled:opacity-70 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        >
          {TASK_STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

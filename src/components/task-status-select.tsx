"use client";

import { useState, useTransition } from "react";
import { TASK_STATUS_OPTIONS } from "@/lib/constants";
import type { Enums } from "@/lib/supabase/database.types";
import { updateTaskStatus } from "@/app/tasks/actions";

export function TaskStatusSelect({
  taskId,
  currentStatus,
}: {
  taskId: string;
  currentStatus: Enums<"task_status">;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <select
        value={currentStatus}
        disabled={isPending}
        onChange={(e) => {
          const status = e.target.value;
          setError(null);
          startTransition(async () => {
            const result = await updateTaskStatus(taskId, status);
            if (result?.error) setError(result.error);
          });
        }}
        className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700 transition-shadow focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/30 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      >
        {TASK_STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

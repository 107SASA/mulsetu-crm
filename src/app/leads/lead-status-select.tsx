"use client";

import { useOptimistic, useState, useTransition } from "react";
import { LEAD_STATUS_OPTIONS, leadStatus } from "@/lib/leads";
import type { Enums } from "@/lib/supabase/database.types";
import { Spinner } from "@/components/ui/spinner";
import { updateLeadStatus } from "./actions";

// Status pill that doubles as a dropdown. "Won" is only reachable through
// Convert, so the lead always ends up linked to a real client.
export function LeadStatusSelect({ leadId, status }: { leadId: string; status: Enums<"lead_status"> }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [current, setOptimistic] = useOptimistic(status);
  const tone = leadStatus(current).tone;

  if (status === "won") {
    return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>Won</span>;
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <span className="inline-flex items-center gap-1.5">
        <select
          value={current}
          disabled={isPending}
          aria-label="Lead status"
          onChange={(event) => {
            const next = event.target.value as Enums<"lead_status">;
            setError(null);
            startTransition(async () => {
              setOptimistic(next);
              const result = await updateLeadStatus(leadId, next);
              if (result?.error) setError(result.error);
            });
          }}
          className={`cursor-pointer rounded-full border-0 py-1 pl-2.5 pr-7 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent-500/40 ${tone}`}
        >
          {LEAD_STATUS_OPTIONS.filter((s) => s.value !== "won").map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        {isPending && <Spinner className="h-3.5 w-3.5 text-zinc-400" />}
      </span>
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </span>
  );
}

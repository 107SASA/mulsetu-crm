"use client";

import { useOptimistic, useState, useTransition } from "react";
import { CUSTOMER_STATUS_OPTIONS, customerStatus } from "@/lib/leads";
import type { Enums } from "@/lib/supabase/database.types";
import { Spinner } from "@/components/ui/spinner";
import { updateProductCustomerStatus } from "./actions";

export function CustomerStatusSelect({ customerId, status }: { customerId: string; status: Enums<"customer_status"> }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [current, setOptimistic] = useOptimistic(status);

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <span className="inline-flex items-center gap-1.5">
        {isPending && <Spinner className="h-3.5 w-3.5 text-zinc-400" />}
        <select
          value={current}
          disabled={isPending}
          aria-label="Customer status"
          onChange={(event) => {
            const next = event.target.value as Enums<"customer_status">;
            setError(null);
            startTransition(async () => {
              setOptimistic(next);
              const result = await updateProductCustomerStatus(customerId, next);
              if (result?.error) setError(result.error);
            });
          }}
          className={`cursor-pointer rounded-full border-0 py-1 pl-2.5 pr-7 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent-500/40 ${customerStatus(current).tone}`}
        >
          {CUSTOMER_STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </span>
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </span>
  );
}

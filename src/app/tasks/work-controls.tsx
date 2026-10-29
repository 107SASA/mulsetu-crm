"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { personName, type Person } from "@/components/form/people-picker";
import { Spinner } from "@/components/ui/spinner";
import { FIELD_INLINE } from "@/lib/field-styles";

function useParamNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function setParam(name: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(name, value);
    else params.delete(name);
    params.delete("notice");
    params.delete("error");
    const query = params.toString();
    startTransition(() => router.push(query ? `${pathname}?${query}` : pathname));
  }

  return { setParam, isPending };
}

// Admins: switch between your own work, one person's, or everyone's.
export function PersonSwitcher({ people, currentUserId, value }: { people: Person[]; currentUserId: string; value: string }) {
  const { setParam, isPending } = useParamNavigation();

  return (
    <div className="flex w-full items-center gap-2 sm:w-auto">
      {isPending && <Spinner className="h-4 w-4 text-zinc-400" />}
      <select
        aria-label="Whose work to show"
        value={value}
        onChange={(event) => setParam("person", event.target.value === currentUserId ? null : event.target.value)}
        className={FIELD_INLINE}
      >
        <option value={currentUserId}>My work</option>
        <option value="all">Everyone</option>
        <optgroup label="Team member">
          {people
            .filter((p) => p.id !== currentUserId)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {personName(p)}
              </option>
            ))}
        </optgroup>
      </select>
    </div>
  );
}

function shiftDate(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Previous / next day navigation for the schedule.
export function DayPicker({ date, today }: { date: string; today: string }) {
  const { setParam, isPending } = useParamNavigation();
  const go = (next: string) => setParam("date", next === today ? null : next);
  const arrow =
    "inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";

  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => go(shiftDate(date, -1))} className={arrow} aria-label="Previous day">
        ‹
      </button>
      <input
        type="date"
        value={date}
        onChange={(event) => event.target.value && go(event.target.value)}
        aria-label="Date"
        className="min-w-0 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />
      <button type="button" onClick={() => go(shiftDate(date, 1))} className={arrow} aria-label="Next day">
        ›
      </button>
      {date !== today ? (
        <button
          type="button"
          onClick={() => go(today)}
          className="ml-1 text-xs font-medium text-accent-600 hover:underline dark:text-accent-500"
        >
          Today
        </button>
      ) : null}
      {isPending && <Spinner className="ml-1 h-4 w-4 text-zinc-400" />}
    </div>
  );
}

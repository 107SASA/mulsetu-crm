"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

export type FilterOption = { value: string; label: string };
export type Filter = { name: string; label: string; allLabel: string; options: FilterOption[] };

const SELECT =
  "min-h-10 w-full min-w-0 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-800 shadow-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/30 sm:w-auto dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

// Dropdown filters that apply as soon as one changes (no "Filter" button).
// Each filter maps to a URL search param, so filtered views can be shared.
export function FilterBar({ filters }: { filters: Filter[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const active = filters.some((f) => searchParams.get(f.name));

  function update(name: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(name, value);
    else params.delete(name);
    params.delete("notice");
    params.delete("error");
    const query = params.toString();
    startTransition(() => router.push(query ? `${pathname}?${query}` : pathname));
  }

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());
    for (const filter of filters) params.delete(filter.name);
    const query = params.toString();
    startTransition(() => router.push(query ? `${pathname}?${query}` : pathname));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => (
        <select
          key={filter.name}
          aria-label={filter.label}
          value={searchParams.get(filter.name) ?? ""}
          onChange={(event) => update(filter.name, event.target.value || null)}
          className={SELECT}
        >
          <option value="">{filter.allLabel}</option>
          {filter.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}
      {active && (
        <button
          type="button"
          onClick={clearAll}
          className="min-h-10 px-2 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Clear filters
        </button>
      )}
      {isPending && <Spinner className="h-4 w-4 text-zinc-400" />}
    </div>
  );
}

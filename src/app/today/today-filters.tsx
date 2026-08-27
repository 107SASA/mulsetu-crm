"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FIELD_INLINE, FIELD_LABEL_SM } from "@/lib/field-styles";

export function TodayFilters({
  date,
  developerId,
  currentUserId,
  developers,
  isAdmin,
}: {
  date: string;
  developerId: string;
  currentUserId: string;
  developers: { id: string; full_name: string; email: string }[] | null;
  isAdmin: boolean;
}) {
  const router = useRouter();

  function navigate(nextDate: string, nextDeveloper: string) {
    const params = new URLSearchParams();
    if (nextDate) params.set("date", nextDate);
    if (isAdmin && nextDeveloper) params.set("developer", nextDeveloper);
    const query = params.toString();
    router.push(query ? `/today?${query}` : "/today");
  }

  const todayHref =
    isAdmin && developerId !== currentUserId ? `/today?developer=${developerId}` : "/today";

  return (
    <div className="mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:items-end">
      <div className="w-full min-w-0 sm:w-auto">
        <label htmlFor="date" className={FIELD_LABEL_SM}>
          Date
        </label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(event) => navigate(event.target.value, developerId)}
          className={`mt-1 ${FIELD_INLINE}`}
        />
      </div>
      {isAdmin && developers && (
        <div className="w-full min-w-0 sm:w-auto">
          <label htmlFor="developer" className={FIELD_LABEL_SM}>
            Developer
          </label>
          <select
            id="developer"
            value={developerId}
            onChange={(event) => navigate(date, event.target.value)}
            className={`mt-1 ${FIELD_INLINE}`}
          >
            {developers.map((developer) => (
              <option key={developer.id} value={developer.id}>
                {developer.full_name || developer.email}
              </option>
            ))}
          </select>
        </div>
      )}
      <Link
        href={todayHref}
        className="inline-flex min-h-11 items-center text-sm font-medium text-accent-600 hover:underline sm:min-h-0 sm:self-center dark:text-accent-500"
      >
        Today
      </Link>
    </div>
  );
}

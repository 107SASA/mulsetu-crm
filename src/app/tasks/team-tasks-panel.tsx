import Link from "next/link";
import { TASK_STATUS_OPTIONS } from "@/lib/constants";
import { TaskCard } from "@/components/task-card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FIELD_INLINE } from "@/lib/field-styles";

type TeamTask = {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done" | "blocked";
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string | null;
  assigned_to: string | null;
  project: { id: string; name: string } | null;
  assignee: { full_name: string; email: string } | null;
};

export function TeamTasksPanel({
  profiles,
  tasks,
  developerFilter,
  statusFilter,
}: {
  profiles: { id: string; full_name: string; email: string }[];
  tasks: TeamTask[];
  developerFilter?: string;
  statusFilter?: string;
}) {
  const byDeveloper = new Map<string, TeamTask[]>();
  for (const task of tasks) {
    const list = byDeveloper.get(task.assigned_to ?? "unassigned") ?? [];
    list.push(task);
    byDeveloper.set(task.assigned_to ?? "unassigned", list);
  }
  const unassignedTasks = byDeveloper.get("unassigned") ?? [];

  return (
    <>
      <form className="mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:items-center" method="get">
        <input type="hidden" name="view" value="team" />
        <select name="developer" defaultValue={developerFilter ?? ""} className={FIELD_INLINE}>
          <option value="">All developers</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name || p.email}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={statusFilter ?? ""} className={FIELD_INLINE}>
          <option value="">All statuses</option>
          {TASK_STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary" size="sm" className="w-full sm:w-auto">
          Filter
        </Button>
        {(developerFilter || statusFilter) && (
          <Link href="/tasks?view=team" className="self-center text-zinc-500 underline hover:text-accent-600 dark:text-zinc-400">
            Clear
          </Link>
        )}
      </form>

      {profiles.length === 0 && unassignedTasks.length === 0 ? (
        <EmptyState icon="🧑‍🤝‍🧑" title="No developers yet." />
      ) : (
        <div className="mt-6 space-y-8">
          {profiles.map((dev) => {
            const devTasks = byDeveloper.get(dev.id) ?? [];
            return (
              <section key={dev.id}>
                <h2 className="mb-2 flex items-center justify-between text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  <span className="flex items-center gap-2">
                    <Avatar name={dev.full_name || dev.email} size="sm" />
                    {dev.full_name || dev.email}
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {devTasks.length}
                  </span>
                </h2>
                {devTasks.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">No tasks assigned.</p>
                ) : (
                  <div className="space-y-2">
                    {devTasks.map((t) => (
                      <TaskCard key={t.id} task={t} canEditStatus />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
          {!developerFilter && unassignedTasks.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center justify-between text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Unassigned
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {unassignedTasks.length}
                </span>
              </h2>
              <div className="space-y-2">
                {unassignedTasks.map((t) => (
                  <TaskCard key={t.id} task={t} canEditStatus />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}

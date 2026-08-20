import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { TASK_STATUS_OPTIONS } from "@/lib/constants";
import { TaskCard } from "@/components/task-card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FIELD_INLINE } from "@/lib/field-styles";

export default async function TeamTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ developer?: string; status?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/tasks");

  const { developer: developerFilter, status: statusFilter } = await searchParams;
  const supabase = await createClient();

  const { data: profiles } = await supabase.from("profiles").select("id, full_name, email, role").order("full_name");

  let query = supabase
    .from("tasks")
    .select(
      "id, title, status, priority, due_date, assigned_to, project:projects(id, name), assignee:profiles!tasks_assigned_to_fkey(full_name, email)"
    )
    .order("due_date", { ascending: true, nullsFirst: false });

  if (developerFilter) query = query.eq("assigned_to", developerFilter);
  const validStatus = TASK_STATUS_OPTIONS.find((s) => s.value === statusFilter)?.value;
  if (validStatus) query = query.eq("status", validStatus);

  const { data: tasks } = await query;

  const byDeveloper = new Map<string, typeof tasks>();
  for (const t of tasks ?? []) {
    const list = byDeveloper.get(t.assigned_to ?? "unassigned") ?? [];
    list.push(t);
    byDeveloper.set(t.assigned_to ?? "unassigned", list);
  }

  const developersToShow = profiles ?? [];
  const unassignedTasks = byDeveloper.get("unassigned") ?? [];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Team tasks</h1>
        <Link href="/tasks" className="text-sm text-zinc-500 hover:text-accent-600 hover:underline dark:text-zinc-400">
          My tasks
        </Link>
      </div>

      <form className="mt-4 flex flex-wrap items-center gap-3 text-sm" method="get">
        <select name="developer" defaultValue={developerFilter ?? ""} className={FIELD_INLINE}>
          <option value="">All developers</option>
          {profiles?.map((p) => (
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
        <Button type="submit" variant="secondary" size="sm">
          Filter
        </Button>
        {(developerFilter || statusFilter) && (
          <Link href="/tasks/team" className="self-center text-zinc-500 underline hover:text-accent-600 dark:text-zinc-400">
            Clear
          </Link>
        )}
      </form>

      {developersToShow.length === 0 && unassignedTasks.length === 0 ? (
        <EmptyState icon="🧑‍🤝‍🧑" title="No developers yet." />
      ) : (
        <div className="mt-6 space-y-8">
          {developersToShow.map((dev) => {
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
    </div>
  );
}

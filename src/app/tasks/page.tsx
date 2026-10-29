import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { TaskCard, type TaskCardData } from "@/components/task-card";
import { DeleteButton } from "@/components/delete-button";
import { PageHeading } from "@/components/page-heading";
import { FormError } from "@/components/form/fields";
import { personName, type Person } from "@/components/form/people-picker";
import { CARD } from "@/lib/card-styles";
import { createTask, deleteTask } from "./actions";
import { createScheduleItem, deleteScheduleItem } from "./schedule-actions";
import { AddWorkForm } from "./add-work-form";
import { DayPicker, PersonSwitcher } from "./work-controls";

const TYPE_ICON: Record<string, string> = { meeting: "🗓️", call: "📞", other: "📌" };

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatTime(time: string) {
  const [h, m] = time.split(":");
  const d = new Date(2000, 0, 1, Number(h), Number(m));
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDay(date: string, today: string) {
  if (date === today) return "Today";
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
}

type WorkTask = TaskCardData & { assigned_to: string | null };

export default async function MyWorkPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; person?: string; developer?: string; error?: string }>;
}) {
  const [params, profile, supabase] = await Promise.all([searchParams, getCurrentProfile(), createClient()]);
  if (!profile) return null;

  const isAdmin = profile.role === "admin";
  const today = todayIso();
  const date = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : today;
  const requestedPerson = params.person ?? params.developer;
  const person = isAdmin && requestedPerson ? requestedPerson : profile.id;
  const everyone = person === "all";

  let tasksQuery = supabase
    .from("tasks")
    .select(
      "id, title, status, priority, due_date, assigned_to, project:projects(id, name), assignee:profiles!tasks_assigned_to_fkey(full_name, email)"
    )
    .order("due_date", { ascending: true, nullsFirst: false });
  if (!everyone) tasksQuery = tasksQuery.eq("assigned_to", person);

  let scheduleQuery = supabase
    .from("schedule_items")
    .select("id, title, item_type, start_time, end_time, notes, developer_id, project:projects(id, name)")
    .eq("item_date", date)
    .order("start_time");
  if (!everyone) scheduleQuery = scheduleQuery.eq("developer_id", person);

  const [{ data: people }, { data: projects }, { data: tasks }, { data: schedule }] = await Promise.all([
    isAdmin
      ? supabase.from("profiles").select("id, full_name, email").order("full_name")
      : Promise.resolve({ data: null }),
    supabase.from("projects").select("id, name").not("stage", "in", "(completed,on_hold_cancelled)").order("name"),
    tasksQuery,
    scheduleQuery,
  ]);

  const peopleList: Person[] = people ?? [profile];
  const peopleById = new Map(peopleList.map((p) => [p.id, p]));
  const viewingPerson = everyone ? null : peopleById.get(person);
  const isOwnWork = person === profile.id;

  const query = new URLSearchParams();
  if (person !== profile.id) query.set("person", person);
  if (date !== today) query.set("date", date);
  const returnTo = query.toString() ? `/tasks?${query}` : "/tasks";

  const all = (tasks ?? []) as WorkTask[];
  const open = all.filter((t) => t.status !== "done");
  const done = all.filter((t) => t.status === "done").slice(-30).reverse();
  const groups = [
    { key: "overdue", title: "Overdue", tone: "text-red-600 dark:text-red-400", items: open.filter((t) => t.due_date && t.due_date < today) },
    { key: "today", title: "Due today", tone: "text-accent-600 dark:text-accent-500", items: open.filter((t) => t.due_date === today) },
    { key: "upcoming", title: "Coming up", tone: "text-zinc-500", items: open.filter((t) => t.due_date && t.due_date > today) },
    { key: "someday", title: "No due date", tone: "text-zinc-500", items: open.filter((t) => !t.due_date) },
  ].filter((group) => group.items.length > 0);

  const canEditTask = (t: WorkTask) => isAdmin || t.assigned_to === profile.id;
  const renderTask = (t: WorkTask) => (
    <TaskCard
      key={t.id}
      task={t}
      showAssignee={everyone}
      canEditStatus={canEditTask(t)}
      deleteAction={isAdmin ? deleteTask.bind(null, t.project?.id ?? null, t.id, returnTo) : undefined}
    />
  );

  const title = everyone ? "Everyone's work" : isOwnWork ? "My Work" : `${viewingPerson ? personName(viewingPerson) : "Their"}'s work`;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <PageHeading
        title={title}
        description="Tasks to get done and meetings on the calendar, in one place."
        actions={
          isAdmin ? (
            <Suspense>
              <PersonSwitcher people={peopleList} currentUserId={profile.id} value={person} />
            </Suspense>
          ) : undefined
        }
      />

      {params.error && (
        <div className="mt-4">
          <FormError message={params.error} />
        </div>
      )}

      <div className="mt-6">
        <AddWorkForm
          key={returnTo}
          createTaskAction={createTask.bind(null, null)}
          createMeetingAction={createScheduleItem}
          people={peopleList}
          projects={projects ?? []}
          isAdmin={isAdmin}
          currentUserId={profile.id}
          defaultPerson={everyone ? profile.id : person}
          date={date}
          returnTo={returnTo}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className={`${CARD} min-w-0 p-5 lg:col-span-2`}>
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Tasks</h2>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{open.length} open</span>
          </div>

          {groups.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-400">
              {done.length > 0 ? "Everything's done. 🎉" : "No tasks yet. Add one above."}
            </p>
          ) : (
            <div className="space-y-6">
              {groups.map((group) => (
                <div key={group.key}>
                  <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${group.tone}`}>
                    {group.title} <span className="font-normal text-zinc-400">· {group.items.length}</span>
                  </p>
                  <div className="space-y-2">{group.items.map(renderTask)}</div>
                </div>
              ))}
            </div>
          )}

          {done.length > 0 && (
            <details className="mt-6 border-t border-zinc-100 pt-4 dark:border-zinc-800">
              <summary className="cursor-pointer select-none text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                Completed ({done.length})
              </summary>
              <div className="mt-3 space-y-2">{done.map(renderTask)}</div>
            </details>
          )}
        </section>

        <section className={`${CARD} min-w-0 self-start p-5`}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Schedule</h2>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{formatDay(date, today)}</span>
          </div>
          <Suspense>
            <DayPicker date={date} today={today} />
          </Suspense>

          {!schedule || schedule.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-zinc-200 px-3 py-6 text-center text-sm text-zinc-400 dark:border-zinc-800">
              No meetings or calls.
            </p>
          ) : (
            <ol className="mt-4 space-y-2">
              {schedule.map((item) => {
                const owner = peopleById.get(item.developer_id);
                const canManage = isAdmin || item.developer_id === profile.id;
                return (
                  <li key={item.id} className="flex gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                    <div className="w-16 shrink-0 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {formatTime(item.start_time)}
                      {item.end_time && <span className="block font-normal text-zinc-400">{formatTime(item.end_time)}</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        <span className="mr-1" aria-hidden>
                          {TYPE_ICON[item.item_type] ?? "📌"}
                        </span>
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {[everyone && owner ? personName(owner) : null, item.project?.name, item.notes || null]
                          .filter(Boolean)
                          .join(" · ") || "No project"}
                      </p>
                      {canManage && (
                        <DeleteButton
                          action={deleteScheduleItem.bind(null, returnTo, item.id)}
                          label="Remove"
                          pendingLabel="Removing…"
                          variant="danger-link"
                          className="-ml-2.5 mt-1"
                        />
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}

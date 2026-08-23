import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { TaskCard } from "@/components/task-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CARD } from "@/lib/card-styles";
import { FIELD, FIELD_INLINE, FIELD_LABEL_SM } from "@/lib/field-styles";
import { createScheduleItem, deleteScheduleItem } from "./actions";
import { PageHeading } from "@/components/page-heading";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatTime(time: string) {
  const [h, m] = time.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m));
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

const TYPE_ICON: Record<string, string> = { meeting: "🗓️", call: "📞", other: "📌" };

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; developer?: string; error?: string }>;
}) {
  const { date: dateParam, developer: developerParam, error } = await searchParams;
  const [profile, supabase] = await Promise.all([getCurrentProfile(), createClient()]);
  if (!profile) return null;

  const isAdmin = profile.role === "admin";
  const date = dateParam || todayIso();
  const viewingDeveloperId = isAdmin && developerParam ? developerParam : profile.id;

  const { data: developers } = isAdmin
    ? await supabase.from("profiles").select("id, full_name, email").order("full_name")
    : { data: null };

  const viewingProfile =
    viewingDeveloperId === profile.id ? profile : developers?.find((d) => d.id === viewingDeveloperId);

  const [{ data: scheduleItems }, { data: dueTasks }, { data: projects }] = await Promise.all([
    supabase
      .from("schedule_items")
      .select("id, title, item_type, start_time, end_time, notes, project:projects(id, name)")
      .eq("developer_id", viewingDeveloperId)
      .eq("item_date", date)
      .order("start_time"),
    supabase
      .from("tasks")
      .select("id, title, status, priority, due_date, project:projects(id, name)")
      .eq("assigned_to", viewingDeveloperId)
      .eq("due_date", date),
    supabase.from("projects").select("id, name").order("name"),
  ]);

  const returnTo = `/today?date=${date}${viewingDeveloperId !== profile.id ? `&developer=${viewingDeveloperId}` : ""}`;
  const canManage = isAdmin || viewingDeveloperId === profile.id;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <PageHeading
        kicker="Work"
        title={viewingDeveloperId === profile.id ? "Today" : `${viewingProfile?.full_name || viewingProfile?.email}'s day`}
        description="Schedule and tasks due on the selected date."
      />

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <form className="mt-4 flex flex-wrap items-end gap-3 text-sm" method="get">
        <div>
          <label htmlFor="date" className={FIELD_LABEL_SM}>
            Date
          </label>
          <input id="date" name="date" type="date" defaultValue={date} className={`mt-1 ${FIELD_INLINE}`} />
        </div>
        {isAdmin && developers && (
          <div>
            <label htmlFor="developer" className={FIELD_LABEL_SM}>
              Developer
            </label>
            <select id="developer" name="developer" defaultValue={viewingDeveloperId} className={`mt-1 ${FIELD_INLINE}`}>
              {developers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name || d.email}
                </option>
              ))}
            </select>
          </div>
        )}
        <Button type="submit" variant="secondary">
          Show this day
        </Button>
        <Link href="/today" className="self-center text-sm font-medium text-accent-600 hover:underline dark:text-accent-500">
          Jump to today
        </Link>
      </form>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">Schedule</h2>
        {!scheduleItems || scheduleItems.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Nothing scheduled.</p>
        ) : (
          <ul className="space-y-2">
            {scheduleItems.map((item) => (
              <li key={item.id} className={`${CARD} flex items-center justify-between p-3 text-sm`}>
                <div className="flex items-start gap-2.5">
                  <span className="text-base leading-none">{TYPE_ICON[item.item_type] ?? "📌"}</span>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {formatTime(item.start_time)}
                      {item.end_time ? ` – ${formatTime(item.end_time)}` : ""} · {item.title}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {item.project ? item.project.name : "No project"}
                      {item.notes ? ` · ${item.notes}` : ""}
                    </p>
                  </div>
                </div>
                {canManage && (
                  <form action={deleteScheduleItem.bind(null, returnTo, item.id)}>
                    <button type="submit" className="text-xs text-red-600 hover:underline dark:text-red-400">
                      Remove
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}

        {canManage && (
          <form
            action={createScheduleItem}
            className="mt-4 flex flex-col gap-2 rounded-xl border border-dashed border-zinc-300 p-3 sm:flex-row sm:flex-wrap sm:items-end dark:border-zinc-700"
          >
            <input type="hidden" name="developer_id" value={viewingDeveloperId} />
            <input type="hidden" name="item_date" value={date} />

            <div className="flex-1 sm:min-w-[10rem]">
              <label htmlFor="title" className={FIELD_LABEL_SM}>
                Title
              </label>
              <input id="title" name="title" required placeholder="Client X call" className={`mt-1 ${FIELD}`} />
            </div>
            <div>
              <label htmlFor="item_type" className={FIELD_LABEL_SM}>
                Type
              </label>
              <select id="item_type" name="item_type" defaultValue="meeting" className={`mt-1 ${FIELD_INLINE}`}>
                <option value="meeting">Meeting</option>
                <option value="call">Call</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="start_time" className={FIELD_LABEL_SM}>
                Start
              </label>
              <input id="start_time" name="start_time" type="time" required className={`mt-1 ${FIELD_INLINE}`} />
            </div>
            <div>
              <label htmlFor="end_time" className={FIELD_LABEL_SM}>
                End (optional)
              </label>
              <input id="end_time" name="end_time" type="time" className={`mt-1 ${FIELD_INLINE}`} />
            </div>
            <div>
              <label htmlFor="project_id" className={FIELD_LABEL_SM}>
                Project (optional)
              </label>
              <select id="project_id" name="project_id" defaultValue="" className={`mt-1 ${FIELD_INLINE}`}>
                <option value="">— None —</option>
                {projects?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="primary">
              + Add to schedule
            </Button>
          </form>
        )}
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">Tasks due today</h2>
        {!dueTasks || dueTasks.length === 0 ? (
          <EmptyState icon="✅" title="No tasks due on this date." />
        ) : (
          <div className="space-y-2">
            {dueTasks.map((t) => (
              <TaskCard key={t.id} task={t} canEditStatus={canManage} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

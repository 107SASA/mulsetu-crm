import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { TaskCard } from "@/components/task-card";
import { TaskForm } from "./task-form";
import { createTask } from "./actions";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/page-heading";
import { ViewTabs } from "@/components/view-tabs";
import { TeamTasksPanel } from "./team-tasks-panel";
import { TASK_STATUS_OPTIONS } from "@/lib/constants";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; view?: string; developer?: string; status?: string }>;
}) {
  const { error, view, developer: developerFilter, status: statusFilter } = await searchParams;
  const [profile, supabase] = await Promise.all([getCurrentProfile(), createClient()]);
  if (!profile) return null;

  const isAdmin = profile.role === "admin";
  const showTeam = isAdmin && view === "team";

  const createTaskAction = createTask.bind(null, null);

  if (showTeam) {
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

    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6 sm:py-8">
        <PageHeading
          title="Tasks"
          description="What each person is working on."
          actions={
            <ViewTabs
              items={[
                { href: "/tasks", label: "My Tasks", active: false },
                { href: "/tasks?view=team", label: "Team Tasks", active: true },
              ]}
            />
          }
        />
        <TeamTasksPanel
          profiles={profiles ?? []}
          tasks={tasks ?? []}
          developerFilter={developerFilter}
          statusFilter={statusFilter}
        />
      </div>
    );
  }

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, status, priority, due_date, project:projects(id, name)")
    .eq("assigned_to", profile.id)
    .order("due_date", { ascending: true, nullsFirst: false });

  const active = (tasks ?? []).filter((t) => t.status !== "done");
  const done = (tasks ?? []).filter((t) => t.status === "done");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 sm:py-8">
      <PageHeading
        title="Tasks"
        description="Everything currently assigned to you."
        actions={
          isAdmin ? (
            <ViewTabs
              items={[
                { href: "/tasks", label: "My Tasks", active: true },
                { href: "/tasks?view=team", label: "Team Tasks", active: false },
              ]}
            />
          ) : undefined
        }
      />

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="mt-4">
        <TaskForm
          action={createTaskAction}
          assignableProfiles={[profile]}
          currentUserId={profile.id}
          isAdmin={false}
        />
      </div>

      <section className="mt-6">
        {active.length === 0 ? (
          <EmptyState icon="🎉" title="Nothing on your plate right now." />
        ) : (
          <div className="space-y-2">
            {active.map((t) => (
              <TaskCard key={t.id} task={t} canEditStatus />
            ))}
          </div>
        )}
      </section>

      {done.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">Done</h2>
          <div className="space-y-2 opacity-70">
            {done.map((t) => (
              <TaskCard key={t.id} task={t} canEditStatus />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

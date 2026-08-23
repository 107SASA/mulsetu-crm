import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { TaskCard } from "@/components/task-card";
import { TaskForm } from "./task-form";
import { createTask } from "./actions";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/page-heading";

export default async function MyTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [profile, supabase] = await Promise.all([getCurrentProfile(), createClient()]);
  if (!profile) return null;

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, status, priority, due_date, project:projects(id, name)")
    .eq("assigned_to", profile.id)
    .order("due_date", { ascending: true, nullsFirst: false });

  const active = (tasks ?? []).filter((t) => t.status !== "done");
  const done = (tasks ?? []).filter((t) => t.status === "done");

  const createTaskAction = createTask.bind(null, null);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <PageHeading
        kicker="Work"
        title="My tasks"
        description="Everything currently assigned to you."
        actions={
          profile.role === "admin" ? (
            <Link href="/tasks/team" className="text-sm font-medium text-accent-600 hover:underline dark:text-accent-500">
              Team tasks
            </Link>
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

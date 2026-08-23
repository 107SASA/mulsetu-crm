import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { StatTile } from "@/components/stat-tile";
import { deadlineRisk } from "@/lib/project-risk";
import { Avatar } from "@/components/ui/avatar";
import { CARD } from "@/lib/card-styles";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  const [profile, supabase] = await Promise.all([getCurrentProfile(), createClient()]);
  if (!profile) return null;
  const isAdmin = profile.role === "admin";
  const firstName = profile.full_name.trim().split(/\s+/)[0] || null;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const today = new Date().toISOString().slice(0, 10);

  const [
    { count: activeProjects },
    { count: completedThisMonth },
    { data: openProjectsForRisk },
    { count: overdueTasksOrgWide },
    { count: myOverdueTasks },
    { count: myActiveTasks },
    { data: workloadTasks },
    { data: profiles },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .not("stage", "in", "(completed,on_hold_cancelled)"),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("stage", "completed")
      .gte("updated_at", startOfMonth.toISOString()),
    supabase
      .from("projects")
      .select("deadline, stage")
      .not("stage", "in", "(completed,on_hold_cancelled)")
      .not("deadline", "is", null),
    isAdmin
      ? supabase.from("tasks").select("id", { count: "exact", head: true }).lt("due_date", today).neq("status", "done")
      : Promise.resolve({ count: null }),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("assigned_to", profile.id)
      .lt("due_date", today)
      .neq("status", "done"),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("assigned_to", profile.id)
      .neq("status", "done"),
    isAdmin
      ? supabase.from("tasks").select("assigned_to, status").neq("status", "done")
      : Promise.resolve({ data: null }),
    isAdmin ? supabase.from("profiles").select("id, full_name, email").order("full_name") : Promise.resolve({ data: null }),
  ]);

  const atRiskOrOverdueProjects = (openProjectsForRisk ?? []).filter(
    (p) => deadlineRisk(p.deadline, p.stage) !== "none"
  ).length;

  const workloadByDeveloper = new Map<string, number>();
  for (const t of workloadTasks ?? []) {
    if (!t.assigned_to) continue;
    workloadByDeveloper.set(t.assigned_to, (workloadByDeveloper.get(t.assigned_to) ?? 0) + 1);
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      {message && (
        <p className="mb-6 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          {message}
        </p>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">Dashboard</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {firstName ? `Good to see you, ${firstName}` : "Overview"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {isAdmin ? "A snapshot of the pipeline and the team." : "Your work for today and what’s open."}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 text-sm sm:w-auto sm:flex-row">
          <Link
            href="/today"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent-600 px-3.5 py-2 font-medium text-white shadow-sm hover:bg-accent-700"
          >
            Today’s schedule
          </Link>
          <Link
            href="/board"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3.5 py-2 font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Pipeline
          </Link>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Active projects" value={activeProjects ?? 0} href="/projects" />
        <StatTile label="Completed this month" value={completedThisMonth ?? 0} href="/board" />
        <StatTile
          label="Projects at risk"
          value={atRiskOrOverdueProjects}
          tone={atRiskOrOverdueProjects > 0 ? "danger" : "default"}
          href="/deadlines"
        />
        {isAdmin ? (
          <StatTile
            label="Overdue tasks"
            value={overdueTasksOrgWide ?? 0}
            tone={(overdueTasksOrgWide ?? 0) > 0 ? "danger" : "default"}
            href="/tasks/team"
          />
        ) : (
          <StatTile
            label="Your overdue tasks"
            value={myOverdueTasks ?? 0}
            tone={(myOverdueTasks ?? 0) > 0 ? "danger" : "default"}
            href="/tasks"
          />
        )}
      </div>

      {!isAdmin && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Your open tasks" value={myActiveTasks ?? 0} href="/tasks" />
        </div>
      )}

      {isAdmin && profiles && profiles.length > 0 && (
        <section className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Team workload</h2>
            <Link href="/tasks/team" className="text-sm font-medium text-accent-600 hover:underline dark:text-accent-500">
              View team tasks
            </Link>
          </div>
          <div className={`${CARD} overflow-hidden`}>
            <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-800">
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {profiles.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40">
                    <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={p.full_name || p.email} size="sm" />
                        {p.full_name || p.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-zinc-500 dark:text-zinc-400">
                      {workloadByDeveloper.get(p.id) ?? 0} open
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

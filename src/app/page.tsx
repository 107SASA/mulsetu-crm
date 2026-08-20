import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { StatTile } from "@/components/stat-tile";
import { deadlineRisk } from "@/lib/project-risk";
import { Avatar } from "@/components/ui/avatar";
import { CARD, CARD_INTERACTIVE } from "@/lib/card-styles";

const CARDS = [
  { href: "/today", icon: "📅", title: "Today", description: "Your schedule and tasks due today." },
  { href: "/tasks", icon: "✅", title: "My Tasks", description: "Everything currently assigned to you." },
  { href: "/board", icon: "🗂️", title: "Pipeline board", description: "See every project grouped by stage, at a glance." },
  { href: "/deadlines", icon: "⏰", title: "Deadlines", description: "Upcoming project deadlines, soonest first." },
  { href: "/clients", icon: "👥", title: "Clients", description: "View and manage client records and contacts." },
  { href: "/projects", icon: "📁", title: "Projects", description: "Browse projects as a filterable list." },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  const [profile, supabase] = await Promise.all([getCurrentProfile(), createClient()]);
  if (!profile) return null;
  const isAdmin = profile.role === "admin";

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

  const cards = isAdmin
    ? [
        ...CARDS,
        { href: "/tasks/team", icon: "🧑‍🤝‍🧑", title: "Team Tasks", description: "See what every developer is working on." },
        { href: "/teams", icon: "🧩", title: "Teams", description: "Create developer teams and assign them to projects." },
      ]
    : CARDS;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {message && (
        <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          {message}
        </p>
      )}
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Welcome{profile.full_name ? `, ${profile.full_name}` : ""}
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Signed in as {profile.role}. Here&apos;s where things stand right now.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Active projects" value={activeProjects ?? 0} />
        <StatTile label="Completed this month" value={completedThisMonth ?? 0} />
        <StatTile
          label="Projects at risk"
          value={atRiskOrOverdueProjects}
          tone={atRiskOrOverdueProjects > 0 ? "danger" : "default"}
        />
        {isAdmin ? (
          <StatTile
            label="Overdue tasks (team)"
            value={overdueTasksOrgWide ?? 0}
            tone={(overdueTasksOrgWide ?? 0) > 0 ? "danger" : "default"}
          />
        ) : (
          <StatTile
            label="Your overdue tasks"
            value={myOverdueTasks ?? 0}
            tone={(myOverdueTasks ?? 0) > 0 ? "danger" : "default"}
          />
        )}
      </div>

      {!isAdmin && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Your open tasks" value={myActiveTasks ?? 0} />
        </div>
      )}

      {isAdmin && profiles && profiles.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">Workload per developer</h2>
          <div className={`${CARD} overflow-hidden`}>
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {profiles.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100">
                      <div className="flex items-center gap-2">
                        <Avatar name={p.full_name || p.email} size="sm" />
                        {p.full_name || p.email}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm text-zinc-500 dark:text-zinc-400">
                      {workloadByDeveloper.get(p.id) ?? 0} open task{(workloadByDeveloper.get(p.id) ?? 0) === 1 ? "" : "s"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className={`${CARD_INTERACTIVE} block h-full p-5`}>
            <span className="text-xl">{card.icon}</span>
            <h2 className="mt-2 text-base font-medium text-zinc-900 dark:text-zinc-50">{card.title}</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { deadlineRisk } from "@/lib/project-risk";
import { CARD } from "@/lib/card-styles";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { TaskStatusSelect } from "@/components/task-status-select";
import { STAGE_OPTIONS, priorityColor, priorityLabel, stageDotColor } from "@/lib/constants";
import { leadStatus, sourceText } from "@/lib/leads";
import type { Enums } from "@/lib/supabase/database.types";

const OPEN_LEAD: Enums<"lead_status">[] = ["new", "contacted", "qualified"];
const CLOSED_STAGES = new Set(["completed", "on_hold_cancelled"]);

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function daysBetween(from: string, to: string) {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000);
}

function shortDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function formatTime(time: string) {
  const [h, m] = time.split(":");
  return new Date(2000, 0, 1, Number(h), Number(m)).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date())
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

type AttentionItem = {
  key: string;
  href: string;
  kind: "Project" | "Task" | "Lead";
  title: string;
  detail: string;
  reason: string;
  tone: "red" | "amber";
  sort: number;
};

export default async function Dashboard() {
  const [profile, supabase] = await Promise.all([getCurrentProfile(), createClient()]);
  if (!profile) return null;
  const isAdmin = profile.role === "admin";
  const firstName = profile.full_name.trim().split(/\s+/)[0] || "there";
  const today = todayIso();
  const weekAgo = daysAgoIso(7);

  // One parallel batch for the whole dashboard.
  const [
    { data: projects },
    { data: myTasks },
    { data: teamOverdue },
    { data: schedule },
    { data: leads },
    { count: activeCustomers },
  ] = await Promise.all([
    supabase.from("projects").select("id, name, stage, priority, deadline, client:clients(company_name)"),
    supabase
      .from("tasks")
      .select("id, title, status, priority, due_date, project:projects(id, name)")
      .eq("assigned_to", profile.id)
      .neq("status", "done")
      .order("due_date", { ascending: true, nullsFirst: false }),
    isAdmin
      ? supabase
          .from("tasks")
          .select("id, title, due_date, assigned_to, assignee:profiles!tasks_assigned_to_fkey(full_name, email)")
          .neq("status", "done")
          .lt("due_date", today)
          .neq("assigned_to", profile.id)
          .order("due_date")
          .limit(10)
      : Promise.resolve({ data: null }),
    supabase
      .from("schedule_items")
      .select("id, title, item_type, start_time, end_time, project:projects(id, name)")
      .eq("developer_id", profile.id)
      .eq("item_date", today)
      .order("start_time"),
    // Leads and customers stay empty until migration 0007 is run.
    supabase
      .from("leads")
      .select("id, contact_name, company_name, status, source, source_detail, follow_up_date, created_at, interest")
      .order("created_at", { ascending: false })
      .limit(200),
    isAdmin
      ? supabase.from("product_customers").select("id", { count: "exact", head: true }).in("status", ["active", "trial"])
      : Promise.resolve({ count: null }),
  ]);

  const allProjects = projects ?? [];
  const openProjects = allProjects.filter((p) => !CLOSED_STAGES.has(p.stage));
  const riskyProjects = openProjects
    .map((p) => ({ ...p, risk: deadlineRisk(p.deadline, p.stage) }))
    .filter((p) => p.risk !== "none");
  const upcoming = openProjects
    .filter((p) => p.deadline && p.deadline >= today)
    .sort((a, b) => a.deadline!.localeCompare(b.deadline!))
    .slice(0, 5);

  const tasks = myTasks ?? [];
  const myOverdue = tasks.filter((t) => t.due_date && t.due_date < today);
  const myToday = tasks.filter((t) => t.due_date === today);

  const allLeads = leads ?? [];
  const openLeads = allLeads.filter((l) => OPEN_LEAD.includes(l.status));
  const newThisWeek = allLeads.filter((l) => l.created_at >= weekAgo).length;
  const followUps = openLeads.filter((l) => l.follow_up_date && l.follow_up_date <= today);
  const recentLeads = allLeads.slice(0, 5);

  // Everything that needs action, most urgent first.
  const attention: AttentionItem[] = [
    ...riskyProjects.map((p) => {
      const days = p.deadline ? daysBetween(p.deadline, today) : 0;
      return {
        key: `p-${p.id}`,
        href: `/projects/${p.id}`,
        kind: "Project" as const,
        title: p.name,
        detail: p.client?.company_name ?? "Internal product",
        reason: p.risk === "overdue" ? `${days} day${days === 1 ? "" : "s"} past deadline` : `Due ${shortDate(p.deadline!)}`,
        tone: (p.risk === "overdue" ? "red" : "amber") as AttentionItem["tone"],
        sort: p.risk === "overdue" ? 0 : 2,
      };
    }),
    ...myOverdue.map((t) => ({
      key: `t-${t.id}`,
      href: t.project ? `/projects/${t.project.id}` : "/tasks",
      kind: "Task" as const,
      title: t.title,
      detail: t.project?.name ?? "Your task",
      reason: `Was due ${shortDate(t.due_date!)}`,
      tone: "red" as const,
      sort: 1,
    })),
    ...(teamOverdue ?? []).map((t) => ({
      key: `tt-${t.id}`,
      href: `/tasks?person=${t.assigned_to}`,
      kind: "Task" as const,
      title: t.title,
      detail: t.assignee ? (t.assignee.full_name || t.assignee.email) : "Unassigned",
      reason: `Was due ${shortDate(t.due_date!)}`,
      tone: "amber" as const,
      sort: 3,
    })),
    ...followUps.map((l) => ({
      key: `l-${l.id}`,
      href: `/leads/${l.id}`,
      kind: "Lead" as const,
      title: l.contact_name,
      detail: l.company_name || sourceText(l.source, l.source_detail),
      reason: l.follow_up_date === today ? "Follow up today" : `Follow-up since ${shortDate(l.follow_up_date!)}`,
      tone: "amber" as const,
      sort: 2,
    })),
  ].sort((a, b) => a.sort - b.sort);

  const stageCounts = STAGE_OPTIONS.filter((s) => s.value !== "on_hold_cancelled").map((s) => ({
    ...s,
    count: allProjects.filter((p) => p.stage === s.value).length,
  }));
  const pipelineTotal = stageCounts.reduce((sum, s) => sum + s.count, 0);

  const kpis = [
    { label: "Active projects", value: openProjects.length, sub: `${riskyProjects.length} at risk or overdue`, href: "/projects", alert: riskyProjects.length > 0 },
    { label: "Open leads", value: openLeads.length, sub: `${newThisWeek} new this week`, href: "/leads", alert: false },
    { label: "Follow-ups due", value: followUps.length, sub: followUps.length ? "Call them today" : "All caught up", href: "/leads", alert: followUps.length > 0 },
    isAdmin
      ? { label: "Product customers", value: activeCustomers ?? 0, sub: "Active and on trial", href: "/clients", alert: false }
      : { label: "My open tasks", value: tasks.length, sub: `${myOverdue.length} overdue`, href: "/tasks", alert: myOverdue.length > 0 },
  ];

  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="mx-auto w-full max-w-6xl min-w-0 px-4 py-5 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{dateLabel}</p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {greeting()}, {firstName}
          </h1>
        </div>
        {/* "+ Lead" lives in the header on every page, so it isn't repeated here. */}
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <ButtonLink href="/tasks" variant="secondary" size="sm" className="sm:min-h-9 sm:px-3.5 sm:text-sm">
            + Task
          </ButtonLink>
          {isAdmin ? (
            <ButtonLink href="/projects/new" variant="secondary" size="sm" className="sm:min-h-9 sm:px-3.5 sm:text-sm">
              + Project
            </ButtonLink>
          ) : (
            <ButtonLink href="/projects" variant="secondary" size="sm" className="sm:min-h-9 sm:px-3.5 sm:text-sm">
              Projects
            </ButtonLink>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className={`${CARD} group p-4 transition-colors hover:border-accent-300 dark:hover:border-accent-700/60`}
          >
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{kpi.label}</p>
            <p className="mt-1.5 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{kpi.value}</p>
            <p className={`mt-1 truncate text-xs ${kpi.alert ? "font-medium text-amber-600 dark:text-amber-400" : "text-zinc-500 dark:text-zinc-400"}`}>
              {kpi.sub}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Left: attention + pipeline + deadlines */}
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Panel title="Needs attention" meta={attention.length ? `${attention.length} items` : undefined}>
            {attention.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-2xl">✅</p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Nothing overdue, at risk, or waiting on a follow-up.</p>
              </div>
            ) : (
              <ul className="-mx-2">
                {attention.slice(0, 8).map((item) => (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                    >
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${item.tone === "red" ? "bg-red-500" : "bg-amber-500"}`}
                        aria-hidden
                      />
                      <span className="w-14 shrink-0 text-xs font-medium uppercase tracking-wide text-zinc-400">{item.kind}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.title}</span>
                        <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {item.detail}
                          <span
                            className={`sm:hidden ${item.tone === "red" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}
                          >
                            {" · "}
                            {item.reason}
                          </span>
                        </span>
                      </span>
                      <span
                        className={`hidden shrink-0 text-xs font-medium sm:block ${
                          item.tone === "red" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {item.reason}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {attention.length > 8 && (
              <p className="mt-2 text-xs text-zinc-500">+ {attention.length - 8} more</p>
            )}
          </Panel>

          <Panel title="Pipeline" action={{ href: "/projects?view=pipeline", label: "Open board" }}>
            {pipelineTotal === 0 ? (
              <p className="text-sm text-zinc-400">No projects yet.</p>
            ) : (
              <>
                <div className="flex h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  {stageCounts
                    .filter((s) => s.count > 0)
                    .map((s) => (
                      <div
                        key={s.value}
                        className={stageDotColor(s.value)}
                        style={{ width: `${(s.count / pipelineTotal) * 100}%` }}
                        title={`${s.label}: ${s.count}`}
                      />
                    ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                  {stageCounts.map((s) => (
                    <Link
                      key={s.value}
                      href={`/projects?stage=${s.value}`}
                      className="flex items-center gap-2 rounded-md text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    >
                      <span className={`h-2 w-2 shrink-0 rounded-full ${stageDotColor(s.value)}`} aria-hidden />
                      <span className="min-w-0 flex-1 truncate">{s.label}</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{s.count}</span>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </Panel>

          <Panel title="Upcoming deadlines" action={{ href: "/projects", label: "All projects" }}>
            {upcoming.length === 0 ? (
              <p className="text-sm text-zinc-400">No upcoming deadlines.</p>
            ) : (
              <ul className="-mx-2">
                {upcoming.map((p) => {
                  const days = daysBetween(today, p.deadline!);
                  return (
                    <li key={p.id}>
                      <Link
                        href={`/projects/${p.id}`}
                        className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                      >
                        <span className={`h-2 w-2 shrink-0 rounded-full ${stageDotColor(p.stage)}`} aria-hidden />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{p.name}</span>
                          <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                            {p.client?.company_name ?? "Internal product"}
                          </span>
                        </span>
                        <Badge tone={priorityColor(p.priority)}>{priorityLabel(p.priority)}</Badge>
                        <span className="w-20 shrink-0 text-right text-xs text-zinc-500 dark:text-zinc-400">
                          {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `in ${days} days`}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        {/* Right: my day + leads */}
        <div className="min-w-0 space-y-6">
          <Panel title="My day" action={{ href: "/tasks", label: "My Work" }}>
            {(schedule ?? []).length === 0 && myToday.length === 0 ? (
              <p className="text-sm text-zinc-400">No meetings or tasks due today.</p>
            ) : (
              <ul className="space-y-2">
                {(schedule ?? []).map((item) => (
                  <li key={item.id} className="flex gap-3 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50">
                    <span className="w-14 shrink-0 text-xs font-medium text-accent-700 dark:text-accent-500">
                      {formatTime(item.start_time)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.title}</span>
                      <span className="block truncate text-xs capitalize text-zinc-500">
                        {item.item_type}
                        {item.project ? ` · ${item.project.name}` : ""}
                      </span>
                    </span>
                  </li>
                ))}
                {myToday.map((task) => (
                  <li key={task.id} className="flex items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{task.title}</span>
                      <span className="block truncate text-xs text-zinc-500">{task.project?.name ?? "Task"}</span>
                    </span>
                    <TaskStatusSelect taskId={task.id} currentStatus={task.status} />
                  </li>
                ))}
              </ul>
            )}
            {tasks.length > myToday.length + myOverdue.length && (
              <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                {tasks.length - myToday.length - myOverdue.length} more open tasks later.
              </p>
            )}
          </Panel>

          <Panel title="Recent leads" action={{ href: "/leads", label: "All leads" }}>
            {recentLeads.length === 0 ? (
              <div>
                <p className="text-sm text-zinc-400">No leads yet.</p>
                <ButtonLink href="/leads/new" variant="secondary" size="sm" className="mt-3">
                  + Add a lead
                </ButtonLink>
              </div>
            ) : (
              <ul className="-mx-2">
                {recentLeads.map((lead) => {
                  const status = leadStatus(lead.status);
                  return (
                    <li key={lead.id}>
                      <Link
                        href={`/leads/${lead.id}`}
                        className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                      >
                        <Avatar name={lead.contact_name} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                            {lead.contact_name}
                          </span>
                          <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                            {sourceText(lead.source, lead.source_detail)}
                          </span>
                        </span>
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  meta,
  action,
  children,
}: {
  title: string;
  meta?: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className={`${CARD} p-5`}>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
        {action ? (
          <Link href={action.href} className="text-xs font-medium text-accent-600 hover:underline dark:text-accent-500">
            {action.label} →
          </Link>
        ) : (
          meta && <span className="text-xs text-zinc-500 dark:text-zinc-400">{meta}</span>
        )}
      </div>
      {children}
    </section>
  );
}

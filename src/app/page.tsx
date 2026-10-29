import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { deadlineRisk } from "@/lib/project-risk";
import { CARD, CARD_INTERACTIVE } from "@/lib/card-styles";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { DeadlineBadge } from "@/components/deadline-badge";
import { TaskCard } from "@/components/task-card";
import { stageLabel } from "@/lib/constants";
import { projectSourceLabel, readProjectType } from "@/lib/project-work";

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
  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: activeProjects },
    { data: openProjectsForRisk },
    { data: upcomingDeadlines },
    { data: todayTasks },
    { data: todaySchedule },
    { data: overdueTasks },
    { data: dueLeads },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, stage, priority, deadline, client_id, client:clients(company_name)")
      .not("stage", "in", "(completed,on_hold_cancelled)")
      .order("deadline", { ascending: true, nullsFirst: false })
      .limit(8),
    supabase
      .from("projects")
      .select("id, name, stage, priority, deadline, client_id, client:clients(company_name)")
      .not("stage", "in", "(completed,on_hold_cancelled)")
      .not("deadline", "is", null),
    supabase
      .from("projects")
      .select("id, name, stage, deadline, client_id, client:clients(company_name)")
      .not("stage", "in", "(completed,on_hold_cancelled)")
      .not("deadline", "is", null)
      .gte("deadline", today)
      .order("deadline")
      .limit(6),
    supabase
      .from("tasks")
      .select("id, title, status, priority, due_date, project:projects(id, name)")
      .eq("assigned_to", profile.id)
      .eq("due_date", today),
    supabase
      .from("schedule_items")
      .select("id, title, item_type, start_time")
      .eq("developer_id", profile.id)
      .eq("item_date", today)
      .order("start_time"),
    isAdmin
      ? supabase
          .from("tasks")
          .select("id, title, status, priority, due_date, project:projects(id, name)")
          .lt("due_date", today)
          .neq("status", "done")
          .order("due_date")
          .limit(8)
      : supabase
          .from("tasks")
          .select("id, title, status, priority, due_date, project:projects(id, name)")
          .eq("assigned_to", profile.id)
          .lt("due_date", today)
          .neq("status", "done")
          .order("due_date")
          .limit(8),
    // Leads whose follow-up date has arrived (empty until migration 0007).
    supabase
      .from("leads")
      .select("id, contact_name, company_name, follow_up_date")
      .in("status", ["new", "contacted", "qualified"])
      .lte("follow_up_date", today)
      .order("follow_up_date")
      .limit(5),
  ]);

  const needsAttentionProjects = (openProjectsForRisk ?? []).filter(
    (project) => deadlineRisk(project.deadline, project.stage) !== "none"
  );

  return (
    <div className="mx-auto w-full max-w-6xl min-w-0 px-4 py-5 sm:px-6 sm:py-8">
      {message && (
        <p className="mb-6 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          {message}
        </p>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-50">
            {firstName ? `Good to see you, ${firstName}` : "Dashboard"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            What needs attention, and where to go next.
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          <ButtonLink href="/tasks" variant="secondary">
            My Work
          </ButtonLink>
          {isAdmin ? (
            <ButtonLink href="/projects/new" variant="primary">
              + New project
            </ButtonLink>
          ) : (
            <ButtonLink href="/projects" variant="primary">
              Projects
            </ButtonLink>
          )}
        </div>
      </div>

      {dueLeads && dueLeads.length > 0 && (
        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Leads to follow up</h2>
            <Link href="/leads" className="text-sm font-medium text-accent-600 hover:underline dark:text-accent-500">
              All leads
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {dueLeads.map((lead) => (
              <Link key={lead.id} href={`/leads/${lead.id}`} className={`${CARD_INTERACTIVE} p-3`}>
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{lead.contact_name}</p>
                <p className="truncate text-xs text-amber-600 dark:text-amber-400">
                  {lead.company_name ? `${lead.company_name} · ` : ""}
                  Follow up {lead.follow_up_date === today ? "today" : `since ${new Date(lead.follow_up_date!).toLocaleDateString()}`}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Needs attention</h2>
            <Link href="/projects" className="text-sm font-medium text-accent-600 hover:underline dark:text-accent-500">
              All projects
            </Link>
          </div>
          {needsAttentionProjects.length === 0 && (!overdueTasks || overdueTasks.length === 0) ? (
            <p className={`${CARD} p-4 text-sm text-zinc-500 dark:text-zinc-400`}>Nothing overdue or at risk.</p>
          ) : (
            <div className="space-y-2">
              {needsAttentionProjects.slice(0, 6).map((project) => {
                const type = readProjectType(undefined, project.client_id);
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className={`${CARD_INTERACTIVE} flex items-center justify-between gap-3 p-3`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{project.name}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {projectSourceLabel(type, project.client?.company_name)}
                      </p>
                    </div>
                    <DeadlineBadge deadline={project.deadline} stage={project.stage} />
                  </Link>
                );
              })}
              {(overdueTasks ?? []).slice(0, 4).map((task) => (
                <TaskCard key={task.id} task={task} canEditStatus />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Today’s workload</h2>
            <Link href="/tasks" className="text-sm font-medium text-accent-600 hover:underline dark:text-accent-500">
              Open My Work
            </Link>
          </div>
          {(!todaySchedule || todaySchedule.length === 0) && (!todayTasks || todayTasks.length === 0) ? (
            <p className={`${CARD} p-4 text-sm text-zinc-500 dark:text-zinc-400`}>No tasks or meetings on your calendar today.</p>
          ) : (
            <div className="space-y-2">
              {(todaySchedule ?? []).map((item) => (
                <div key={item.id} className={`${CARD} p-3 text-sm`}>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">{item.title}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {item.item_type} · {item.start_time.slice(0, 5)}
                  </p>
                </div>
              ))}
              {(todayTasks ?? []).map((task) => (
                <TaskCard key={task.id} task={task} canEditStatus />
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Active projects</h2>
            <Link
              href="/projects?view=pipeline"
              className="text-sm font-medium text-accent-600 hover:underline dark:text-accent-500"
            >
              Pipeline
            </Link>
          </div>
          {!activeProjects || activeProjects.length === 0 ? (
            <p className={`${CARD} p-4 text-sm text-zinc-500 dark:text-zinc-400`}>No active projects.</p>
          ) : (
            <ul className="space-y-2">
              {activeProjects.map((project) => {
                const type = readProjectType(undefined, project.client_id);
                return (
                  <li key={project.id}>
                    <Link
                      href={`/projects/${project.id}`}
                      className={`${CARD_INTERACTIVE} flex items-center justify-between gap-3 p-3`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{project.name}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {projectSourceLabel(type, project.client?.company_name)}
                        </p>
                      </div>
                      <Badge tone="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {stageLabel(project.stage)}
                      </Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Upcoming deadlines</h2>
            <Link href="/projects" className="text-sm font-medium text-accent-600 hover:underline dark:text-accent-500">
              View projects
            </Link>
          </div>
          {!upcomingDeadlines || upcomingDeadlines.length === 0 ? (
            <p className={`${CARD} p-4 text-sm text-zinc-500 dark:text-zinc-400`}>No upcoming deadlines.</p>
          ) : (
            <ul className="space-y-2">
              {upcomingDeadlines.map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.id}`}
                    className={`${CARD_INTERACTIVE} flex items-center justify-between gap-3 p-3`}
                  >
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{project.name}</p>
                    <DeadlineBadge deadline={project.deadline} stage={project.stage} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

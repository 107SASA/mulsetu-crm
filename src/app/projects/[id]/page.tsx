import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { priorityColor, priorityLabel } from "@/lib/constants";
import { deadlineRisk } from "@/lib/project-risk";
import { addProjectLink, deleteProjectLink } from "../actions";
import { StageTracker } from "./stage-tracker";
import { DeleteButton } from "@/components/delete-button";
import { TaskCard } from "@/components/task-card";
import { TaskForm } from "@/app/tasks/task-form";
import { createTask, deleteTask } from "@/app/tasks/actions";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button-link";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormError } from "@/components/form/fields";
import { personName } from "@/components/form/people-picker";
import { CARD } from "@/lib/card-styles";
import { FIELD } from "@/lib/field-styles";
import { readAssignedTeam } from "@/lib/teams";
import { projectTypeLabel, readProjectType } from "@/lib/project-work";
import { ProductCustomersCard, type ProductCustomer } from "@/app/customers/product-customers-card";
import { isMissingTable } from "@/lib/leads";

const PROJECT_SELECT =
  "*, client:clients(id, company_name, contact_name, contact_email, contact_phone), assignee:profiles!projects_assigned_to_fkey(id, full_name, email), team:teams!projects_assigned_team_id_fkey(id, name, team_members(profile:profiles(id, full_name, email)))";
const PROJECT_SELECT_WITHOUT_TEAM =
  "*, client:clients(id, company_name, contact_name, contact_email, contact_phone), assignee:profiles!projects_assigned_to_fkey(id, full_name, email)";

type Member = { id: string; full_name: string; email: string };

function readTeamMembers(team: unknown): Member[] {
  const rows = (team as { team_members?: { profile: Member | Member[] | null }[] } | null)?.team_members ?? [];
  return rows
    .map((row) => (Array.isArray(row.profile) ? row.profile[0] : row.profile))
    .filter((member): member is Member => Boolean(member));
}

function formatDate(value: string | null) {
  return value
    ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
    : null;
}

function daysUntil(date: string) {
  const due = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

function deadlineNote(deadline: string, closed: boolean) {
  if (closed) return null;
  const days = daysUntil(deadline);
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days > 1) return `${days} days left`;
  return `${-days} day${days === -1 ? "" : "s"} overdue`;
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ id }, { error }, profile, supabase] = await Promise.all([
    params,
    searchParams,
    getCurrentProfile(),
    createClient(),
  ]);
  if (!profile) return null;
  const isAdmin = profile.role === "admin";

  const [
    withTeam,
    { data: links },
    { data: tasks },
    { data: people },
    { data: customers, error: customersError },
    { count: openLeads },
    { data: clients },
  ] = await Promise.all([
    supabase.from("projects").select(PROJECT_SELECT).eq("id", id).single(),
    supabase.from("project_links").select("id, label, url").eq("project_id", id).order("created_at"),
    supabase
      .from("tasks")
      .select("id, title, status, priority, due_date, assigned_to, assignee:profiles!tasks_assigned_to_fkey(full_name, email)")
      .eq("project_id", id)
      .order("due_date", { ascending: true, nullsFirst: false }),
    isAdmin
      ? supabase.from("profiles").select("id, full_name, email").order("full_name")
      : Promise.resolve({ data: null }),
    // Customers and leads only matter for internal products; fetched in the
    // same batch so the page never waits on a second round-trip.
    supabase
      .from("product_customers")
      .select("id, plan, status, started_on, renewal_date, value, client:clients(id, company_name, contact_name)")
      .eq("product_id", id)
      .order("created_at"),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("product_id", id)
      .in("status", ["new", "contacted", "qualified"]),
    isAdmin ? supabase.from("clients").select("id, company_name").order("company_name") : Promise.resolve({ data: null }),
  ]);

  // Older databases without the teams migration can't embed `team`.
  const { data: project } =
    withTeam.error && withTeam.error.code !== "PGRST116"
      ? await supabase.from("projects").select(PROJECT_SELECT_WITHOUT_TEAM).eq("id", id).single()
      : withTeam;
  if (!project) notFound();

  const team = "team" in project ? project.team : null;
  const assignedTeam = readAssignedTeam(team);
  const teamMembers = readTeamMembers(team);
  const projectType = readProjectType("project_type" in project ? project.project_type : undefined, project.client_id);
  const closed = project.stage === "completed" || project.stage === "on_hold_cancelled";
  const risk = deadlineRisk(project.deadline, project.stage);

  const openTasks = (tasks ?? []).filter((t) => t.status !== "done");
  const doneTasks = (tasks ?? []).filter((t) => t.status === "done");
  const canEditTask = (assignedTo: string | null) => isAdmin || assignedTo === profile.id;
  const deleteTaskAction = (taskId: string) => (isAdmin ? deleteTask.bind(null, id, taskId, null) : undefined);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <Link href="/projects" className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
        ← All projects
      </Link>

      {/* Header */}
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{project.name}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            {projectType === "client" && project.client ? (
              <Link href={`/clients/${project.client.id}`} className="font-medium text-accent-600 hover:underline dark:text-accent-500">
                {project.client.company_name}
              </Link>
            ) : (
              <span>{projectTypeLabel(projectType)}</span>
            )}
            <Badge tone={priorityColor(project.priority)}>{priorityLabel(project.priority)} priority</Badge>
            {risk !== "none" && (
              <Badge
                tone={
                  risk === "overdue"
                    ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                }
              >
                {risk === "overdue" ? "Overdue" : "At risk"}
              </Badge>
            )}
          </div>
        </div>
        {isAdmin && (
          <ButtonLink href={`/projects/${id}/edit`} variant="secondary" className="w-full shrink-0 sm:w-auto">
            Edit project
          </ButtonLink>
        )}
      </div>

      {error && (
        <div className="mt-4">
          <FormError message={error} />
        </div>
      )}

      <div className={`${CARD} mt-5 p-4 sm:p-5`}>
        <StageTracker projectId={id} stage={project.stage} canEdit={isAdmin} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Card title="About">
            {project.description ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{project.description}</p>
            ) : (
              <p className="text-sm text-zinc-400">
                No description yet.
                {isAdmin && (
                  <>
                    {" "}
                    <Link href={`/projects/${id}/edit`} className="text-accent-600 hover:underline dark:text-accent-500">
                      Add one
                    </Link>
                  </>
                )}
              </p>
            )}
          </Card>

          {projectType === "internal" && (
            <ProductCustomersCard
              productId={id}
              customers={(customers ?? []) as ProductCustomer[]}
              clients={clients ?? []}
              openLeads={openLeads ?? 0}
              isAdmin={isAdmin}
              setupMissing={isMissingTable(customersError)}
            />
          )}

          <Card
            id="tasks"
            title="Tasks"
            meta={tasks && tasks.length > 0 ? `${openTasks.length} open · ${doneTasks.length} done` : undefined}
          >
            {openTasks.length === 0 ? (
              <p className="text-sm text-zinc-400">{doneTasks.length > 0 ? "All tasks are done. 🎉" : "No tasks yet."}</p>
            ) : (
              <div className="space-y-2">
                {openTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={{ ...t, project: null }}
                    showAssignee
                    canEditStatus={canEditTask(t.assigned_to)}
                    deleteAction={deleteTaskAction(t.id)}
                  />
                ))}
              </div>
            )}

            {doneTasks.length > 0 && (
              <details className="group mt-3">
                <summary className="cursor-pointer select-none text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                  Show {doneTasks.length} completed
                </summary>
                <div className="mt-2 space-y-2">
                  {doneTasks.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={{ ...t, project: null }}
                      showAssignee
                      canEditStatus={canEditTask(t.assigned_to)}
                      deleteAction={deleteTaskAction(t.id)}
                    />
                  ))}
                </div>
              </details>
            )}

            <div className="mt-5 border-t border-zinc-100 pt-5 dark:border-zinc-800">
              <p className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">Add a task</p>
              <TaskForm
                action={createTask.bind(null, id)}
                people={people ?? [profile]}
                currentUserId={profile.id}
                isAdmin={isAdmin}
                defaultAssignee={project.assigned_to}
              />
            </div>
          </Card>
        </div>

        {/* Side column */}
        <div className="min-w-0 space-y-6">
          <Card title="Details">
            <dl className="space-y-3 text-sm">
              <Row label="Deadline">
                {project.deadline ? (
                  <span className="text-right">
                    {formatDate(project.deadline)}
                    {deadlineNote(project.deadline, closed) && (
                      <span
                        className={`block text-xs ${
                          risk === "overdue"
                            ? "text-red-600 dark:text-red-400"
                            : risk === "at_risk"
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-zinc-500"
                        }`}
                      >
                        {deadlineNote(project.deadline, closed)}
                      </span>
                    )}
                  </span>
                ) : (
                  "—"
                )}
              </Row>
              <Row label="Start date">{formatDate(project.start_date) ?? "—"}</Row>
              <Row label="Type">{projectTypeLabel(projectType)}</Row>
              {isAdmin && (
                <Row label="Budget">{project.budget != null ? Number(project.budget).toLocaleString() : "—"}</Row>
              )}
            </dl>
          </Card>

          <Card title="People">
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Lead developer</p>
                {project.assignee ? (
                  <p className="mt-1 flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                    <Avatar name={personName(project.assignee)} size="sm" />
                    {personName(project.assignee)}
                  </p>
                ) : (
                  <p className="mt-1 text-zinc-400">Not assigned</p>
                )}
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Team</p>
                {assignedTeam ? (
                  <>
                    <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">{assignedTeam.name}</p>
                    {teamMembers.length > 0 && (
                      <ul className="mt-2 space-y-1.5">
                        {teamMembers.map((member) => (
                          <li key={member.id} className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                            <Avatar name={personName(member)} size="sm" />
                            {personName(member)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <p className="mt-1 text-zinc-400">No team</p>
                )}
              </div>
              {projectType === "client" && project.client && (project.client.contact_name || project.client.contact_email || project.client.contact_phone) && (
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Client contact</p>
                  <p className="mt-1 text-zinc-900 dark:text-zinc-100">{project.client.contact_name || "—"}</p>
                  {project.client.contact_email && (
                    <a href={`mailto:${project.client.contact_email}`} className="block truncate text-accent-600 hover:underline dark:text-accent-500">
                      {project.client.contact_email}
                    </a>
                  )}
                  {project.client.contact_phone && (
                    <a href={`tel:${project.client.contact_phone}`} className="block text-accent-600 hover:underline dark:text-accent-500">
                      {project.client.contact_phone}
                    </a>
                  )}
                </div>
              )}
            </div>
          </Card>

          <Card id="links" title="Links" meta={links && links.length > 0 ? String(links.length) : undefined}>
            {!links || links.length === 0 ? (
              <p className="text-sm text-zinc-400">
                {isAdmin ? "Add the Drive folder, Figma file, repo, or anything the team needs." : "No links yet."}
              </p>
            ) : (
              <ul className="-mx-2 space-y-0.5">
                {links.map((link) => (
                  <li key={link.id} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/60">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden>
                      <path d="M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z" />
                      <path d="M11.603 7.963a.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 1 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865Z" />
                    </svg>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-zinc-900 group-hover:text-accent-600 dark:text-zinc-100 dark:group-hover:text-accent-500">
                        {link.label}
                      </span>
                      <span className="block truncate text-xs text-zinc-400">{hostname(link.url)}</span>
                    </a>
                    {isAdmin && (
                      <DeleteButton
                        action={deleteProjectLink.bind(null, id, link.id)}
                        label="Remove"
                        pendingLabel="…"
                        variant="danger-link"
                        className="shrink-0"
                      />
                    )}
                  </li>
                ))}
              </ul>
            )}

            {isAdmin && (
              <form action={addProjectLink.bind(null, id)} className="mt-4 space-y-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                <input name="url" inputMode="url" placeholder="Paste a link" required aria-label="Link URL" className={FIELD} />
                <div className="flex gap-2">
                  <input name="label" placeholder="Name (optional)" aria-label="Link name" className={`min-w-0 flex-1 ${FIELD}`} />
                  <SubmitButton variant="secondary" pendingLabel="Adding…">
                    Add
                  </SubmitButton>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function Card({ id, title, meta, children }: { id?: string; title: string; meta?: string; children: React.ReactNode }) {
  return (
    <section id={id} className={`${CARD} scroll-mt-4 p-5`}>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
        {meta && <span className="text-xs text-zinc-500 dark:text-zinc-400">{meta}</span>}
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="text-right font-medium text-zinc-900 dark:text-zinc-100">{children}</dd>
    </div>
  );
}

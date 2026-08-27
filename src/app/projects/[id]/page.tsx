import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { priorityColor, priorityLabel, stageLabel } from "@/lib/constants";
import { ProjectForm } from "../project-form";
import { updateProjectRecord, deleteProjectRecord, addProjectLink, deleteProjectLink } from "../actions";
import { DeleteButton } from "@/components/delete-button";
import { TaskCard } from "@/components/task-card";
import { TaskForm } from "@/app/tasks/task-form";
import { createTask, deleteTask } from "@/app/tasks/actions";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CARD } from "@/lib/card-styles";
import { FIELD } from "@/lib/field-styles";
import { fetchAssignmentTeams, readAssignedTeam } from "@/lib/teams";
import { ViewTabs } from "@/components/view-tabs";
import { projectSourceLabel, projectTypeLabel, readProjectType } from "@/lib/project-work";

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; tab?: string }>;
}) {
  const { id } = await params;
  const { error, tab } = await searchParams;
  const [profile, supabase] = await Promise.all([getCurrentProfile(), createClient()]);
  const isAdmin = profile?.role === "admin";
  const activeTab = tab === "tasks" || tab === "links" ? tab : "overview";

  const withTeam = await supabase
    .from("projects")
    .select(
      "*, client:clients(id, company_name), assignee:profiles!projects_assigned_to_fkey(full_name, email), team:teams!projects_assigned_team_id_fkey(id, name)"
    )
    .eq("id", id)
    .single();
  const { data: project } = withTeam.error
    ? await supabase
        .from("projects")
        .select("*, client:clients(id, company_name), assignee:profiles!projects_assigned_to_fkey(full_name, email)")
        .eq("id", id)
        .single()
    : withTeam;
  if (!project) notFound();
  const assignedTeam = readAssignedTeam("team" in project ? project.team : null);
  const projectType = readProjectType(
    "project_type" in project ? project.project_type : undefined,
    project.client_id
  );

  const { data: links } = await supabase
    .from("project_links")
    .select("id, label, url")
    .eq("project_id", id)
    .order("created_at");

  const { data: clients } = isAdmin
    ? await supabase.from("clients").select("id, company_name").order("company_name")
    : { data: null };

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, status, priority, due_date, assigned_to, assignee:profiles!tasks_assigned_to_fkey(full_name, email)")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").order("full_name");
  const teams = isAdmin ? await fetchAssignmentTeams(supabase) : [];

  const updateAction = updateProjectRecord.bind(null, id);
  const deleteAction = deleteProjectRecord.bind(null, id);
  const addLinkAction = addProjectLink.bind(null, id);
  const createTaskAction = createTask.bind(null, id);

  const tabError = error ? `&error=${encodeURIComponent(error)}` : "";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 sm:py-8">
      <Link href="/projects" className="text-sm text-zinc-500 hover:underline dark:text-zinc-400">
        ← All projects
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{project.name}</h1>
        <Badge tone={priorityColor(project.priority)}>{priorityLabel(project.priority)}</Badge>
        <Badge tone="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{stageLabel(project.stage)}</Badge>
        <Badge tone="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {projectTypeLabel(projectType)}
        </Badge>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
        {projectType === "client" && project.client?.id ? (
          <span>
            for{" "}
            <Link href={`/clients/${project.client.id}`} className="text-accent-600 underline dark:text-accent-500">
              {project.client.company_name}
            </Link>
          </span>
        ) : (
          <span>{projectSourceLabel(projectType, project.client?.company_name)}</span>
        )}
        <span className="flex items-center gap-1.5">
          {project.assignee ? (
            <>
              <Avatar name={project.assignee.full_name || project.assignee.email} size="sm" />
              {project.assignee.full_name || project.assignee.email}
            </>
          ) : (
            <span className="italic">No developer assigned</span>
          )}
        </span>
        <span>{assignedTeam ? `Team: ${assignedTeam.name}` : "No team assigned"}</span>
      </div>

      <div className="mt-5">
        <ViewTabs
          items={[
            { href: `/projects/${id}${error && activeTab === "overview" ? `?error=${encodeURIComponent(error)}` : ""}`, label: "Overview", active: activeTab === "overview" },
            { href: `/projects/${id}?tab=tasks${tabError}`, label: `Tasks (${tasks?.length ?? 0})`, active: activeTab === "tasks" },
            { href: `/projects/${id}?tab=links${tabError}`, label: `Links (${links?.length ?? 0})`, active: activeTab === "links" },
          ]}
        />
      </div>

      {activeTab === "overview" && (
        <>
          <section className={`${CARD} mt-6 p-5`}>
            <h2 className="mb-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {isAdmin ? "Edit project" : "Project details"}
            </h2>
            {isAdmin && clients ? (
              <ProjectForm
                action={updateAction}
                clients={clients}
                developers={profiles ?? []}
                teams={teams}
                defaults={project}
                error={error}
                submitLabel="Save changes"
                showBudget
              />
            ) : (
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-zinc-400">Description</dt>
                  <dd className="mt-0.5 text-zinc-900 dark:text-zinc-100">{project.description || "—"}</dd>
                </div>
                <Detail label="Type" value={projectTypeLabel(projectType)} />
                <Detail
                  label="Assigned developer"
                  value={project.assignee ? project.assignee.full_name || project.assignee.email : "Unassigned"}
                />
                <Detail label="Assigned team" value={assignedTeam?.name ?? "None"} />
                <Detail label="Start date" value={project.start_date ? new Date(project.start_date).toLocaleDateString() : null} />
                <Detail label="Deadline" value={project.deadline ? new Date(project.deadline).toLocaleDateString() : null} />
              </dl>
            )}
          </section>

          {isAdmin && (
            <section className="mt-8 border-t border-zinc-200 pt-6 dark:border-zinc-800">
              <h2 className="text-sm font-medium text-red-600 dark:text-red-400">Danger zone</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Deleting a project also deletes its tasks, schedule links, and links.
              </p>
              <DeleteButton action={deleteAction} confirmMessage={`Delete "${project.name}"? This cannot be undone.`} />
            </section>
          )}
        </>
      )}

      {activeTab === "links" && (
        <section className="mt-6">
          {error && (
            <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}
          {!links || links.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No links added yet.</p>
          ) : (
            <ul className="space-y-2">
              {links.map((l) => (
                <li key={l.id} className={`${CARD} flex items-center justify-between p-3 text-sm`}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-accent-600 underline dark:text-accent-500"
                  >
                    {l.label}
                  </a>
                  {isAdmin && (
                    <form action={deleteProjectLink.bind(null, id, l.id)}>
                      <button type="submit" className="text-xs text-red-600 hover:underline dark:text-red-400">
                        Remove
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}

          {isAdmin && (
            <form action={addLinkAction} className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input name="label" placeholder="Label (e.g. Drive folder)" required className={`flex-1 ${FIELD}`} />
              <input name="url" type="url" placeholder="https://…" required className={`flex-1 ${FIELD}`} />
              <Button type="submit" variant="secondary" className="w-full sm:w-auto">
                + Add link
              </Button>
            </form>
          )}
        </section>
      )}

      {activeTab === "tasks" && (
        <section className="mt-6">
          {error && (
            <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}
          {!tasks || tasks.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No tasks for this project yet.</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((t) => (
                <div key={t.id} className="group relative">
                  <TaskCard
                    task={{ ...t, project: null }}
                    showAssignee
                    canEditStatus={isAdmin || t.assigned_to === profile?.id}
                  />
                  {isAdmin && (
                    <form action={deleteTask.bind(null, id, t.id)} className="mt-1 text-right">
                      <button type="submit" className="text-xs text-red-600 hover:underline dark:text-red-400">
                        Delete task
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}

          {profile && (
            <div className="mt-4">
              <TaskForm
                action={createTaskAction}
                assignableProfiles={isAdmin && profiles ? profiles : [profile]}
                currentUserId={profile.id}
                isAdmin={isAdmin}
              />
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-zinc-400">{label}</dt>
      <dd className="mt-0.5 text-zinc-900 dark:text-zinc-100">{value || "—"}</dd>
    </div>
  );
}

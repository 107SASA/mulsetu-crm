import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { STAGE_OPTIONS, priorityColor, priorityLabel, stageLabel } from "@/lib/constants";
import { DeadlineBadge } from "@/components/deadline-badge";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CARD_INTERACTIVE } from "@/lib/card-styles";
import { readAssignedTeam } from "@/lib/teams";
import { PageHeading } from "@/components/page-heading";
import { ViewTabs } from "@/components/view-tabs";
import { PipelineBoard, type BoardProject } from "@/app/board/pipeline-board";
import { PROJECT_TYPE_OPTIONS, projectSourceLabel, readProjectType } from "@/lib/project-work";

const FILTER_SELECT =
  "min-h-11 w-full max-w-full rounded-lg border border-zinc-300 px-3 py-2 text-base text-zinc-900 shadow-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/30 sm:min-h-0 sm:w-auto sm:py-1.5 sm:text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

function projectsHref(params: {
  view?: string;
  client?: string;
  stage?: string;
  type?: string;
}) {
  const search = new URLSearchParams();
  if (params.view === "pipeline") search.set("view", "pipeline");
  if (params.client) search.set("client", params.client);
  if (params.stage) search.set("stage", params.stage);
  if (params.type === "client" || params.type === "internal") search.set("type", params.type);
  const query = search.toString();
  return query ? `/projects?${query}` : "/projects";
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; stage?: string; type?: string; view?: string; error?: string }>;
}) {
  const { client: clientFilter, stage: stageFilter, type: typeFilter, view, error } = await searchParams;
  const [profile, supabase] = await Promise.all([getCurrentProfile(), createClient()]);
  const isAdmin = profile?.role === "admin";
  const isPipeline = view === "pipeline";

  const { data: clients } = await supabase.from("clients").select("id, company_name").order("company_name");

  const selectWithTeam =
    "id, name, stage, priority, deadline, client_id, project_type, client:clients(id, company_name), assignee:profiles!projects_assigned_to_fkey(full_name, email), team:teams!projects_assigned_team_id_fkey(id, name)";
  const selectWithoutTeam =
    "id, name, stage, priority, deadline, client_id, project_type, client:clients(id, company_name), assignee:profiles!projects_assigned_to_fkey(full_name, email)";
  const selectFallback =
    "id, name, stage, priority, deadline, client_id, client:clients(id, company_name), assignee:profiles!projects_assigned_to_fkey(full_name, email)";

  const validStage = STAGE_OPTIONS.find((s) => s.value === stageFilter)?.value;
  const validType = PROJECT_TYPE_OPTIONS.find((option) => option.value === typeFilter)?.value;

  const withTeamQuery = supabase
    .from("projects")
    .select(selectWithTeam)
    .order("deadline", { ascending: true, nullsFirst: false });
  const withoutTeamQuery = supabase
    .from("projects")
    .select(selectWithoutTeam)
    .order("deadline", { ascending: true, nullsFirst: false });
  const fallbackQuery = supabase
    .from("projects")
    .select(selectFallback)
    .order("deadline", { ascending: true, nullsFirst: false });

  function withFilters<T extends { eq: (column: string, value: string) => T }>(query: T, includeType: boolean) {
    let next = query;
    if (clientFilter) next = next.eq("client_id", clientFilter);
    if (validStage) next = next.eq("stage", validStage);
    if (includeType && validType) next = next.eq("project_type", validType);
    return next;
  }

  const { data: firstPass, error: projectsError } = await withFilters(withTeamQuery, true);
  const secondPass = projectsError ? await withFilters(withoutTeamQuery, true) : null;
  const thirdPass = secondPass?.error ? await withFilters(fallbackQuery, false) : null;

  const projects = ((thirdPass?.data ?? secondPass?.data ?? firstPass) ?? []).map((project) => {
    const type = readProjectType(
      "project_type" in project ? project.project_type : undefined,
      project.client_id
    );
    return {
      ...project,
      project_type: type,
      team: readAssignedTeam((project as { team?: unknown }).team),
    };
  });

  const filterState = { client: clientFilter, stage: stageFilter, type: typeFilter };

  return (
    <div className={`mx-auto w-full min-w-0 px-4 py-5 sm:px-6 sm:py-8 ${isPipeline ? "max-w-7xl" : "max-w-6xl"}`}>
      <PageHeading
        title="Projects"
        description="All work — client projects and internal products."
        actions={
          <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto">
            <ViewTabs
              items={[
                { href: projectsHref(filterState), label: "List", active: !isPipeline },
                {
                  href: projectsHref({ ...filterState, view: "pipeline" }),
                  label: "Pipeline",
                  active: isPipeline,
                },
              ]}
            />
            {isAdmin ? (
              <ButtonLink href="/projects/new" variant="primary" size="sm" className="w-full sm:w-auto">
                New project
              </ButtonLink>
            ) : null}
          </div>
        }
      />

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <form className="mt-4 flex flex-wrap items-center gap-3 text-sm" method="get">
        {isPipeline && <input type="hidden" name="view" value="pipeline" />}
        <select name="client" defaultValue={clientFilter ?? ""} className={FILTER_SELECT}>
          <option value="">All clients</option>
          {clients?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.company_name}
            </option>
          ))}
        </select>
        <select name="type" defaultValue={validType ?? ""} className={FILTER_SELECT}>
          <option value="">All types</option>
          {PROJECT_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select name="stage" defaultValue={stageFilter ?? ""} className={FILTER_SELECT}>
          <option value="">All stages</option>
          {STAGE_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary" size="sm">
          Filter
        </Button>
        {(clientFilter || stageFilter || validType) && (
          <Link
            href={isPipeline ? "/projects?view=pipeline" : "/projects"}
            className="self-center text-zinc-500 underline hover:text-accent-600 dark:text-zinc-400"
          >
            Clear
          </Link>
        )}
      </form>

      {isPipeline ? (
        <PipelineBoard
          projects={projects as BoardProject[]}
          isAdmin={Boolean(isAdmin)}
        />
      ) : !projects || projects.length === 0 ? (
        <EmptyState icon="📁" title="No projects match these filters." />
      ) : (
        <ul className="mt-6 space-y-3">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/projects/${p.id}`}
                className={`${CARD_INTERACTIVE} flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between`}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">{p.name}</p>
                  <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                    {projectSourceLabel(p.project_type, p.client?.company_name)}
                    {p.assignee && ` · ${p.assignee.full_name || p.assignee.email}`}
                    {p.team && ` · Team: ${p.team.name}`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge tone={priorityColor(p.priority)}>{priorityLabel(p.priority)}</Badge>
                  <Badge tone="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {stageLabel(p.stage)}
                  </Badge>
                  <DeadlineBadge deadline={p.deadline} stage={p.stage} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

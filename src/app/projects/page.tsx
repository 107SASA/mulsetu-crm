import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { STAGE_OPTIONS, priorityColor, priorityLabel, stageDotColor, stageLabel } from "@/lib/constants";
import { DeadlineBadge } from "@/components/deadline-badge";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
import { FormError } from "@/components/form/fields";
import { FilterBar } from "@/components/filter-bar";
import { CARD } from "@/lib/card-styles";
import { readAssignedTeam } from "@/lib/teams";
import { PageHeading } from "@/components/page-heading";
import { ViewTabs } from "@/components/view-tabs";
import { PipelineBoard, type BoardProject } from "@/app/board/pipeline-board";
import { PROJECT_TYPE_OPTIONS, projectSourceLabel, readProjectType } from "@/lib/project-work";

function projectsHref(params: { view?: string; client?: string; stage?: string; type?: string }) {
  const search = new URLSearchParams();
  if (params.view === "pipeline") search.set("view", "pipeline");
  if (params.client) search.set("client", params.client);
  if (params.stage && params.view !== "pipeline") search.set("stage", params.stage);
  if (params.type === "client" || params.type === "internal") search.set("type", params.type);
  const query = search.toString();
  return query ? `/projects?${query}` : "/projects";
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; stage?: string; type?: string; view?: string; error?: string }>;
}) {
  const [{ client: clientFilter, stage: stageFilter, type: typeFilter, view, error }, profile, supabase] =
    await Promise.all([searchParams, getCurrentProfile(), createClient()]);
  const isAdmin = profile?.role === "admin";
  const isPipeline = view === "pipeline";

  const selectWithTeam =
    "id, name, stage, priority, deadline, client_id, project_type, client:clients(id, company_name), assignee:profiles!projects_assigned_to_fkey(full_name, email), team:teams!projects_assigned_team_id_fkey(id, name)";
  const selectFallback =
    "id, name, stage, priority, deadline, client_id, client:clients(id, company_name), assignee:profiles!projects_assigned_to_fkey(full_name, email)";

  const validStage = isPipeline ? undefined : STAGE_OPTIONS.find((s) => s.value === stageFilter)?.value;
  const validType = PROJECT_TYPE_OPTIONS.find((option) => option.value === typeFilter)?.value;

  function withFilters<T extends { eq: (column: string, value: string) => T }>(query: T, includeType: boolean) {
    let next = query;
    if (clientFilter) next = next.eq("client_id", clientFilter);
    if (validStage) next = next.eq("stage", validStage);
    if (includeType && validType) next = next.eq("project_type", validType);
    return next;
  }

  const [{ data: clients }, { data: firstPass, error: projectsError }] = await Promise.all([
    supabase.from("clients").select("id, company_name").order("company_name"),
    withFilters(
      supabase.from("projects").select(selectWithTeam).order("deadline", { ascending: true, nullsFirst: false }),
      true
    ),
  ]);
  // Older databases without the teams/project_type migrations.
  const fallback = projectsError
    ? await withFilters(
        supabase.from("projects").select(selectFallback).order("deadline", { ascending: true, nullsFirst: false }),
        false
      )
    : null;

  const projects = ((fallback?.data ?? firstPass) ?? []).map((project) => ({
    ...project,
    project_type: readProjectType("project_type" in project ? project.project_type : undefined, project.client_id),
    team: readAssignedTeam((project as { team?: unknown }).team),
  }));

  const filterState = { client: clientFilter, stage: stageFilter, type: typeFilter };
  const filters = [
    {
      name: "client",
      label: "Client",
      allLabel: "All clients",
      options: (clients ?? []).map((c) => ({ value: c.id, label: c.company_name })),
    },
    { name: "type", label: "Type", allLabel: "All types", options: PROJECT_TYPE_OPTIONS },
    ...(isPipeline ? [] : [{ name: "stage", label: "Stage", allLabel: "All stages", options: STAGE_OPTIONS }]),
  ];

  return (
    <div className={`mx-auto w-full min-w-0 px-4 py-5 sm:px-6 sm:py-8 ${isPipeline ? "max-w-[96rem]" : "max-w-6xl"}`}>
      <PageHeading
        title="Projects"
        description={isPipeline ? "Every project by stage. Drag a card to move it." : "All client work and internal products."}
        actions={
          <>
            <ViewTabs
              items={[
                { href: projectsHref(filterState), label: "List", active: !isPipeline },
                { href: projectsHref({ ...filterState, view: "pipeline" }), label: "Pipeline", active: isPipeline },
              ]}
            />
            {isAdmin && (
              <ButtonLink href="/projects/new" variant="primary" className="w-full sm:w-auto">
                + New project
              </ButtonLink>
            )}
          </>
        }
      />

      {error && (
        <div className="mt-4">
          <FormError message={error} />
        </div>
      )}

      <div className="mt-5">
        <Suspense>
          <FilterBar filters={filters} />
        </Suspense>
      </div>

      {isPipeline ? (
        <PipelineBoard projects={projects as BoardProject[]} isAdmin={Boolean(isAdmin)} />
      ) : projects.length === 0 ? (
        <EmptyState
          icon="📁"
          title={clientFilter || stageFilter || validType ? "No projects match these filters." : "No projects yet."}
          action={
            isAdmin && !(clientFilter || stageFilter || validType) ? (
              <ButtonLink href="/projects/new" variant="primary" size="sm">
                Create your first project
              </ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <div className={`${CARD} mt-5 divide-y divide-zinc-100 overflow-hidden dark:divide-zinc-800`}>
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="flex flex-col gap-2 px-4 py-3.5 transition-colors hover:bg-zinc-50 sm:flex-row sm:items-center sm:gap-4 dark:hover:bg-zinc-800/50"
            >
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${stageDotColor(p.stage)}`} aria-hidden />
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">{p.name}</p>
                  <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                    {projectSourceLabel(p.project_type, p.client?.company_name)} · {stageLabel(p.stage)}
                    {p.team && ` · ${p.team.name}`}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 pl-5 text-xs sm:pl-0">
                <Badge tone={priorityColor(p.priority)}>{priorityLabel(p.priority)}</Badge>
                <span className="w-32 sm:text-right">
                  <DeadlineBadge deadline={p.deadline} stage={p.stage} />
                </span>
                {p.assignee ? (
                  <span title={p.assignee.full_name || p.assignee.email}>
                    <Avatar name={p.assignee.full_name || p.assignee.email} size="sm" />
                  </span>
                ) : (
                  <span className="h-6 w-6" aria-hidden />
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

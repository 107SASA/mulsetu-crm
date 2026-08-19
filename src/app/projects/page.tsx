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

const FILTER_SELECT =
  "rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; stage?: string; error?: string }>;
}) {
  const { client: clientFilter, stage: stageFilter, error } = await searchParams;
  const [profile, supabase] = await Promise.all([getCurrentProfile(), createClient()]);
  const isAdmin = profile?.role === "admin";

  const { data: clients } = await supabase.from("clients").select("id, company_name").order("company_name");

  let query = supabase
    .from("projects")
    .select(
      "id, name, stage, priority, deadline, client:clients(id, company_name), assignee:profiles!projects_assigned_to_fkey(full_name, email)"
    )
    .order("deadline", { ascending: true, nullsFirst: false });

  const validStage = STAGE_OPTIONS.find((s) => s.value === stageFilter)?.value;

  if (clientFilter) query = query.eq("client_id", clientFilter);
  if (validStage) query = query.eq("stage", validStage);

  const { data: projects } = await query;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Projects</h1>
        {isAdmin && (
          <ButtonLink href="/projects/new" variant="primary" size="sm">
            + New project
          </ButtonLink>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {/* Filters — plain GET form, no client JS needed */}
      <form className="mt-4 flex flex-wrap items-center gap-3 text-sm" method="get">
        <select name="client" defaultValue={clientFilter ?? ""} className={FILTER_SELECT}>
          <option value="">All clients</option>
          {clients?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.company_name}
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
        {(clientFilter || stageFilter) && (
          <Link href="/projects" className="self-center text-zinc-500 underline hover:text-accent-600 dark:text-zinc-400">
            Clear
          </Link>
        )}
      </form>

      {!projects || projects.length === 0 ? (
        <EmptyState icon="📁" title="No projects match these filters." />
      ) : (
        <ul className="mt-6 space-y-3">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/projects/${p.id}`}
                className={`${CARD_INTERACTIVE} flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between`}
              >
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">{p.name}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {p.client?.company_name}
                    {p.assignee && ` · ${p.assignee.full_name || p.assignee.email}`}
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

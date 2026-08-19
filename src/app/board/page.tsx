import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { STAGE_OPTIONS, priorityColor, priorityLabel } from "@/lib/constants";
import { DeadlineBadge } from "@/components/deadline-badge";
import { deadlineRisk } from "@/lib/project-risk";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { StageSelect } from "./stage-select";
import type { Tables } from "@/lib/supabase/database.types";

type BoardProject = Pick<Tables<"projects">, "id" | "name" | "stage" | "priority" | "deadline"> & {
  client: Pick<Tables<"clients">, "id" | "company_name"> | null;
  assignee: { full_name: string; email: string } | null;
};

const RISK_BORDER: Record<string, string> = {
  overdue: "border-l-4 border-l-red-500",
  at_risk: "border-l-4 border-l-amber-500",
  none: "border-l-4 border-l-transparent",
};

export default async function BoardPage() {
  const [profile, supabase] = await Promise.all([getCurrentProfile(), createClient()]);
  const isAdmin = profile?.role === "admin";

  const { data: projects } = await supabase
    .from("projects")
    .select(
      "id, name, stage, priority, deadline, client:clients(id, company_name), assignee:profiles!projects_assigned_to_fkey(full_name, email)"
    )
    .order("deadline", { ascending: true, nullsFirst: false });

  const byStage = new Map<string, BoardProject[]>();
  for (const s of STAGE_OPTIONS) byStage.set(s.value, []);
  for (const p of (projects ?? []) as BoardProject[]) {
    byStage.get(p.stage)?.push(p);
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Pipeline board</h1>
        <Link href="/projects" className="text-sm text-zinc-500 hover:text-accent-600 hover:underline dark:text-zinc-400">
          View as list
        </Link>
      </div>

      {/* Mobile: stacked full-width sections (vertical scroll).
          Desktop: horizontal-scrolling columns, classic Kanban layout. */}
      <div className="scroll-thin mt-6 flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-4 sm:overflow-x-auto sm:pb-4">
        {STAGE_OPTIONS.map((stage) => {
          const stageProjects = byStage.get(stage.value) ?? [];
          return (
            <section key={stage.value} className="sm:w-72 sm:shrink-0">
              <h2 className="mb-2 flex items-center justify-between text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {stage.label}
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {stageProjects.length}
                </span>
              </h2>

              <div className="space-y-2">
                {stageProjects.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-zinc-200 p-3 text-xs text-zinc-400 dark:border-zinc-800">
                    No projects
                  </p>
                ) : (
                  stageProjects.map((p) => {
                    const risk = deadlineRisk(p.deadline, p.stage);
                    return (
                      <div
                        key={p.id}
                        className={`rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 ${RISK_BORDER[risk]}`}
                      >
                        <Link href={`/projects/${p.id}`} className="block">
                          <p className="text-sm font-medium text-zinc-900 hover:text-accent-600 dark:text-zinc-50 dark:hover:text-accent-500">
                            {p.name}
                          </p>
                          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                            {p.client?.company_name}
                          </p>
                        </Link>

                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                          <Badge tone={priorityColor(p.priority)}>{priorityLabel(p.priority)}</Badge>
                          <DeadlineBadge deadline={p.deadline} stage={p.stage} />
                        </div>

                        {p.assignee && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                            <Avatar name={p.assignee.full_name || p.assignee.email} size="sm" />
                            {p.assignee.full_name || p.assignee.email}
                          </div>
                        )}

                        {isAdmin && (
                          <div className="mt-2">
                            <StageSelect projectId={p.id} currentStage={p.stage} />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

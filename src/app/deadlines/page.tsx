import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { priorityColor, priorityLabel, stageLabel } from "@/lib/constants";
import { deadlineRisk } from "@/lib/project-risk";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

const RISK_BORDER: Record<string, string> = {
  overdue: "border-l-4 border-l-red-500",
  at_risk: "border-l-4 border-l-amber-500",
  none: "border-l-4 border-l-transparent",
};

export default async function DeadlinesPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, stage, priority, deadline, client:clients(id, company_name)")
    .not("stage", "in", "(completed,on_hold_cancelled)")
    .not("deadline", "is", null)
    .order("deadline", { ascending: true });

  const groups = new Map<string, NonNullable<typeof projects>>();
  for (const p of projects ?? []) {
    const key = p.deadline as string;
    const list = groups.get(key) ?? [];
    list.push(p);
    groups.set(key, list);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Upcoming deadlines</h1>
        <Link href="/board" className="text-sm text-zinc-500 hover:text-accent-600 hover:underline dark:text-zinc-400">
          View pipeline board
        </Link>
      </div>

      {groups.size === 0 ? (
        <EmptyState icon="⏰" title="No open projects have a deadline set." />
      ) : (
        <div className="mt-6 space-y-6">
          {[...groups.entries()].map(([date, items]) => (
            <section key={date}>
              <h2 className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {new Date(date).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </h2>
              <div className="space-y-2">
                {items.map((p) => {
                  const risk = deadlineRisk(p.deadline, p.stage);
                  return (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      className={`flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900 ${RISK_BORDER[risk]}`}
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{p.name}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{p.client?.company_name}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        {risk === "overdue" && (
                          <Badge tone="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">Overdue</Badge>
                        )}
                        {risk === "at_risk" && (
                          <Badge tone="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">At risk</Badge>
                        )}
                        <Badge tone={priorityColor(p.priority)}>{priorityLabel(p.priority)}</Badge>
                        <Badge tone="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                          {stageLabel(p.stage)}
                        </Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

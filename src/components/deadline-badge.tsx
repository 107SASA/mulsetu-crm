import type { Enums } from "@/lib/supabase/database.types";
import { deadlineRisk } from "@/lib/project-risk";

export function DeadlineBadge({
  deadline,
  stage,
}: {
  deadline: string | null;
  stage: Enums<"project_stage">;
}) {
  if (!deadline) return null;

  const risk = deadlineRisk(deadline, stage);
  const label = new Date(deadline).toLocaleDateString();

  if (risk === "overdue") {
    return <span className="font-medium text-red-600 dark:text-red-400">Overdue: {label}</span>;
  }
  if (risk === "at_risk") {
    return <span className="font-medium text-amber-600 dark:text-amber-400">At risk: {label}</span>;
  }
  return <span className="text-zinc-500 dark:text-zinc-400">Due {label}</span>;
}

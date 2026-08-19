import type { Enums } from "@/lib/supabase/database.types";

const CLOSED_STAGES: Enums<"project_stage">[] = ["completed", "on_hold_cancelled"];
const PRE_REVIEW_STAGES: Enums<"project_stage">[] = ["incoming", "requirements", "in_progress"];

export type DeadlineRisk = "overdue" | "at_risk" | "none";

// "Overdue": past deadline and not finished.
// "At risk": due within 2 days and hasn't reached Review/Testing yet.
export function deadlineRisk(deadline: string | null, stage: Enums<"project_stage">): DeadlineRisk {
  if (!deadline || CLOSED_STAGES.includes(stage)) return "none";

  const due = new Date(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysUntilDue = Math.round((due.getTime() - today.getTime()) / msPerDay);

  if (daysUntilDue < 0) return "overdue";
  if (daysUntilDue <= 2 && PRE_REVIEW_STAGES.includes(stage)) return "at_risk";
  return "none";
}

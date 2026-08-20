import type { Enums } from "@/lib/supabase/database.types";

export const STAGE_OPTIONS: { value: Enums<"project_stage">; label: string }[] = [
  { value: "incoming", label: "Incoming / Lead" },
  { value: "requirements", label: "Requirements" },
  { value: "in_progress", label: "In Development" },
  { value: "review_testing", label: "Review / Testing" },
  { value: "client_review", label: "Client Review" },
  { value: "completed", label: "Completed" },
  { value: "on_hold_cancelled", label: "On Hold / Cancelled" },
];

export const PRIORITY_OPTIONS: { value: Enums<"priority_level">; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const TASK_STATUS_OPTIONS: { value: Enums<"task_status">; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
  { value: "blocked", label: "Blocked" },
];

export function stageLabel(stage: Enums<"project_stage">) {
  return STAGE_OPTIONS.find((s) => s.value === stage)?.label ?? stage;
}

export function taskStatusLabel(status: Enums<"task_status">) {
  return TASK_STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;
}

const TASK_STATUS_COLORS: Record<Enums<"task_status">, string> = {
  todo: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  in_progress: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  done: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  blocked: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export function taskStatusColor(status: Enums<"task_status">) {
  return TASK_STATUS_COLORS[status];
}

export function priorityLabel(priority: Enums<"priority_level">) {
  return PRIORITY_OPTIONS.find((p) => p.value === priority)?.label ?? priority;
}

const PRIORITY_COLORS: Record<Enums<"priority_level">, string> = {
  low: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  medium: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  high: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  urgent: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export function priorityColor(priority: Enums<"priority_level">) {
  return PRIORITY_COLORS[priority];
}

import Link from "next/link";
import { priorityColor, priorityLabel } from "@/lib/constants";
import { TaskStatusSelect } from "@/components/task-status-select";
import { DeleteButton } from "@/components/delete-button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import type { Enums } from "@/lib/supabase/database.types";

export type TaskCardData = {
  id: string;
  title: string;
  status: Enums<"task_status">;
  priority: Enums<"priority_level">;
  due_date: string | null;
  project: { id: string; name: string } | null;
  assignee?: { full_name: string; email: string } | null;
};

function isOverdue(dueDate: string | null, status: Enums<"task_status">) {
  if (!dueDate || status === "done") return false;
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

export function TaskCard({
  task,
  showAssignee,
  canEditStatus,
  deleteAction,
}: {
  task: TaskCardData;
  showAssignee?: boolean;
  canEditStatus: boolean;
  deleteAction?: (formData: FormData) => void;
}) {
  const overdue = isOverdue(task.due_date, task.status);
  const done = task.status === "done";

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-3 transition-shadow hover:shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900 ${
        overdue ? "border-l-4 border-l-red-500" : ""
      }`}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        {showAssignee && task.assignee && <Avatar name={task.assignee.full_name || task.assignee.email} size="sm" />}
        <div className="min-w-0">
          <p className={`font-medium ${done ? "text-zinc-400 line-through" : "text-zinc-900 dark:text-zinc-50"}`}>
            {task.title}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-zinc-500 dark:text-zinc-400">
            {showAssignee && task.assignee && <span>{task.assignee.full_name || task.assignee.email}</span>}
            {task.project && (
              <Link href={`/projects/${task.project.id}`} className="hover:text-accent-600 hover:underline dark:hover:text-accent-500">
                {task.project.name}
              </Link>
            )}
            {task.due_date && (
              <span className={overdue ? "font-medium text-red-600 dark:text-red-400" : undefined}>
                {overdue ? "Overdue · " : "Due "}
                {new Date(task.due_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {!done && <Badge tone={priorityColor(task.priority)}>{priorityLabel(task.priority)}</Badge>}
        {canEditStatus ? (
          <TaskStatusSelect taskId={task.id} currentStatus={task.status} />
        ) : (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{task.status.replace(/_/g, " ")}</span>
        )}
        {deleteAction && (
          <DeleteButton
            action={deleteAction}
            label="Delete"
            confirmMessage={`Delete task "${task.title}"?`}
            variant="danger-link"
            className=""
          />
        )}
      </div>
    </div>
  );
}

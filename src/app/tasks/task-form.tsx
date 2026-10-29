import { SubmitButton } from "@/components/ui/submit-button";
import type { Person } from "@/components/form/people-picker";
import { TaskFields } from "./task-fields";

// Compact "add a task" form for a known project (the project page).
export function TaskForm({
  action,
  people,
  currentUserId,
  isAdmin,
  defaultAssignee,
}: {
  action: (formData: FormData) => void;
  people: Person[];
  currentUserId: string;
  isAdmin: boolean;
  defaultAssignee?: string | null;
}) {
  return (
    <form action={action} className="space-y-4">
      <TaskFields people={people} isAdmin={isAdmin} currentUserId={currentUserId} defaultAssignee={defaultAssignee} />
      <div className="flex justify-end">
        <SubmitButton pendingLabel="Adding…" className="w-full sm:w-auto">
          Add task
        </SubmitButton>
      </div>
    </form>
  );
}

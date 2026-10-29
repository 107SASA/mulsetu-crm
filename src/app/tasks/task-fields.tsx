import { PRIORITY_OPTIONS } from "@/lib/constants";
import { SelectField, TextField } from "@/components/form/fields";
import { personName, type Person } from "@/components/form/people-picker";

// Fields for adding a task. Shared by the project page and My Work so both
// create tasks the same way. Pass `projects` to let the user pick a project;
// leave it out when the project is already known.
export function TaskFields({
  people,
  isAdmin,
  currentUserId,
  defaultAssignee,
  projects,
  defaultDueDate,
  idPrefix = "task",
}: {
  people: Person[];
  isAdmin: boolean;
  currentUserId: string;
  defaultAssignee?: string | null;
  projects?: { id: string; name: string }[];
  defaultDueDate?: string;
  idPrefix?: string;
}) {
  return (
    <div className="space-y-4">
      <TextField
        id={`${idPrefix}-title`}
        label="Task"
        name="title"
        placeholder="What needs to be done?"
        required
      />
      <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${projects ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        {projects && (
          <SelectField
            id={`${idPrefix}-project`}
            label="Project"
            name="project_id"
            placeholder="No project"
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
            optional
          />
        )}
        {isAdmin ? (
          <SelectField
            id={`${idPrefix}-assignee`}
            label="Assign to"
            name="assigned_to"
            defaultValue={defaultAssignee ?? currentUserId}
            options={people.map((p) => ({ value: p.id, label: p.id === currentUserId ? `${personName(p)} (me)` : personName(p) }))}
          />
        ) : (
          <input type="hidden" name="assigned_to" value={currentUserId} />
        )}
        <SelectField
          id={`${idPrefix}-priority`}
          label="Priority"
          name="priority"
          defaultValue="medium"
          options={PRIORITY_OPTIONS}
        />
        <TextField
          id={`${idPrefix}-due`}
          label="Due date"
          name="due_date"
          type="date"
          defaultValue={defaultDueDate}
          optional
        />
      </div>
    </div>
  );
}

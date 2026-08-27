import { PRIORITY_OPTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { FIELD, FIELD_INLINE, FIELD_LABEL_SM } from "@/lib/field-styles";

export function TaskForm({
  action,
  assignableProfiles,
  currentUserId,
  isAdmin,
}: {
  action: (formData: FormData) => void;
  assignableProfiles: { id: string; full_name: string; email: string }[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="min-w-0 flex-1 sm:min-w-[10rem]">
        <label htmlFor="title" className={FIELD_LABEL_SM}>
          Task title
        </label>
        <input id="title" name="title" required className={`mt-1 ${FIELD}`} />
      </div>

      {isAdmin ? (
        <div className="w-full min-w-0 sm:w-auto">
          <label htmlFor="assigned_to" className={FIELD_LABEL_SM}>
            Assign to
          </label>
          <select id="assigned_to" name="assigned_to" defaultValue={currentUserId} className={`mt-1 ${FIELD_INLINE}`}>
            {assignableProfiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name || p.email}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <input type="hidden" name="assigned_to" value={currentUserId} />
      )}

      <div className="w-full min-w-0 sm:w-auto">
        <label htmlFor="priority" className={FIELD_LABEL_SM}>
          Priority
        </label>
        <select id="priority" name="priority" defaultValue="medium" className={`mt-1 ${FIELD_INLINE}`}>
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div className="w-full min-w-0 sm:w-auto">
        <label htmlFor="due_date" className={FIELD_LABEL_SM}>
          Due date
        </label>
        <input id="due_date" name="due_date" type="date" className={`mt-1 ${FIELD_INLINE}`} />
      </div>

      <Button type="submit" variant="secondary" className="w-full sm:w-auto">
        + Add task
      </Button>
    </form>
  );
}

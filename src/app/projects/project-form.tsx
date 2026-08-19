import { STAGE_OPTIONS, PRIORITY_OPTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { FIELD, FIELD_LABEL } from "@/lib/field-styles";

type ProjectDefaults = {
  client_id?: string;
  name?: string;
  description?: string;
  stage?: string;
  priority?: string;
  start_date?: string | null;
  deadline?: string | null;
  budget?: number | null;
  assigned_to?: string | null;
};

export function ProjectForm({
  action,
  clients,
  developers,
  defaults,
  error,
  submitLabel,
  showBudget,
}: {
  action: (formData: FormData) => void;
  clients: { id: string; company_name: string }[];
  developers: { id: string; full_name: string; email: string }[];
  defaults?: ProjectDefaults;
  error?: string;
  submitLabel: string;
  showBudget: boolean;
}) {
  return (
    <form action={action} className="space-y-4">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="client_id" className={FIELD_LABEL}>
          Client
        </label>
        <select
          id="client_id"
          name="client_id"
          required
          defaultValue={defaults?.client_id ?? ""}
          className={`mt-1 ${FIELD}`}
        >
          <option value="" disabled>
            Select a client…
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.company_name}
            </option>
          ))}
        </select>
      </div>

      <Field label="Project name" name="name" defaultValue={defaults?.name} required />

      <div>
        <label htmlFor="assigned_to" className={FIELD_LABEL}>
          Assigned developer
        </label>
        <select id="assigned_to" name="assigned_to" defaultValue={defaults?.assigned_to ?? ""} className={`mt-1 ${FIELD}`}>
          <option value="">— Unassigned —</option>
          {developers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.full_name || d.email}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="description" className={FIELD_LABEL}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaults?.description}
          className={`mt-1 ${FIELD}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="stage" className={FIELD_LABEL}>
            Stage
          </label>
          <select id="stage" name="stage" defaultValue={defaults?.stage ?? "incoming"} className={`mt-1 ${FIELD}`}>
            {STAGE_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="priority" className={FIELD_LABEL}>
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            defaultValue={defaults?.priority ?? "medium"}
            className={`mt-1 ${FIELD}`}
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Start date" name="start_date" type="date" defaultValue={defaults?.start_date ?? undefined} />
        <Field label="Deadline" name="deadline" type="date" defaultValue={defaults?.deadline ?? undefined} />
      </div>

      {showBudget && (
        <Field
          label="Budget / value (optional)"
          name="budget"
          type="number"
          defaultValue={defaults?.budget != null ? String(defaults.budget) : undefined}
        />
      )}

      <Button type="submit" variant="primary" className="w-full sm:w-auto">
        {submitLabel}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className={FIELD_LABEL}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className={`mt-1 ${FIELD}`}
      />
    </div>
  );
}

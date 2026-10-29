import { STAGE_OPTIONS, PRIORITY_OPTIONS } from "@/lib/constants";
import {
  FormActions,
  FormError,
  FormSection,
  FormSections,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/form/fields";
import { ProjectAssignmentFields, type AssignmentTeam } from "./project-assignment-fields";
import { ProjectTypeFields } from "./project-type-fields";
import { readProjectType, type ProjectWorkType } from "@/lib/project-work";

type ProjectDefaults = {
  client_id?: string | null;
  project_type?: string | null;
  name?: string;
  description?: string;
  stage?: string;
  priority?: string;
  start_date?: string | null;
  deadline?: string | null;
  budget?: number | null;
  assigned_to?: string | null;
  assigned_team_id?: string | null;
};

// The one project form, used by both "New project" and "Edit project".
export function ProjectForm({
  action,
  clients,
  developers,
  teams,
  defaults,
  error,
  submitLabel,
  pendingLabel = "Saving…",
  cancelHref,
}: {
  action: (formData: FormData) => void;
  clients: { id: string; company_name: string }[];
  developers: { id: string; full_name: string; email: string }[];
  teams: AssignmentTeam[];
  defaults?: ProjectDefaults;
  error?: string;
  submitLabel: string;
  pendingLabel?: string;
  cancelHref?: string;
}) {
  const defaultType: ProjectWorkType = readProjectType(defaults?.project_type, defaults?.client_id);

  return (
    <form action={action} className="space-y-4">
      <FormError message={error} />

      <FormSections>
        <FormSection title="What is it?" description="Name the project and say who it's for.">
          <ProjectTypeFields
            clients={clients}
            defaultType={defaultType}
            defaultClientId={defaults?.client_id ?? undefined}
          />
          <TextField
            label="Project name"
            name="name"
            defaultValue={defaults?.name}
            placeholder="e.g. Website redesign"
            required
          />
          <TextAreaField
            label="Description"
            name="description"
            defaultValue={defaults?.description}
            placeholder="Goals, scope, and anything the team should know."
            optional
          />
        </FormSection>

        <FormSection title="Status & timeline" description="Where it stands and when it's due.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField label="Stage" name="stage" defaultValue={defaults?.stage ?? "incoming"} options={STAGE_OPTIONS} />
            <SelectField
              label="Priority"
              name="priority"
              defaultValue={defaults?.priority ?? "medium"}
              options={PRIORITY_OPTIONS}
            />
            <TextField label="Start date" name="start_date" type="date" defaultValue={defaults?.start_date} optional />
            <TextField
              label="Deadline"
              name="deadline"
              type="date"
              defaultValue={defaults?.deadline}
              optional
              hint="Drives the at-risk and overdue warnings."
            />
          </div>
          <TextField
            label="Budget / value"
            name="budget"
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            defaultValue={defaults?.budget != null ? String(defaults.budget) : undefined}
            optional
            hint="Only admins can see this."
          />
        </FormSection>

        <FormSection title="People" description="Who is responsible for delivering it.">
          <ProjectAssignmentFields
            developers={developers}
            teams={teams}
            assignedTo={defaults?.assigned_to}
            assignedTeamId={defaults?.assigned_team_id}
          />
        </FormSection>
      </FormSections>

      <FormActions submitLabel={submitLabel} pendingLabel={pendingLabel} cancelHref={cancelHref} />
    </form>
  );
}

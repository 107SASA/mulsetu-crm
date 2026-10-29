"use client";

import { useState } from "react";
import { FieldHint, FieldLabel, SelectField, TextField } from "@/components/form/fields";
import { PeoplePicker, personName } from "@/components/form/people-picker";
import { FIELD } from "@/lib/field-styles";

const CREATE_TEAM = "__create__";

export type AssignmentDeveloper = { id: string; full_name: string; email: string };
export type AssignmentTeam = { id: string; name: string; member_ids: string[] };

export function ProjectAssignmentFields({
  developers,
  teams,
  assignedTo,
  assignedTeamId,
}: {
  developers: AssignmentDeveloper[];
  teams: AssignmentTeam[];
  assignedTo?: string | null;
  assignedTeamId?: string | null;
}) {
  const [teamValue, setTeamValue] = useState(assignedTeamId ?? "");
  const creatingTeam = teamValue === CREATE_TEAM;
  const selectedTeam = teams.find((team) => team.id === teamValue);
  const memberNames = (selectedTeam?.member_ids ?? []).map((id) => {
    const member = developers.find((developer) => developer.id === id);
    return member ? personName(member) : "Unknown";
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField
          label="Lead developer"
          name="assigned_to"
          defaultValue={assignedTo}
          placeholder="Unassigned"
          options={developers.map((developer) => ({ value: developer.id, label: personName(developer) }))}
          optional
        />

        <div className="min-w-0">
          <FieldLabel htmlFor="assigned_team_id" optional>
            Team
          </FieldLabel>
          <select
            id="assigned_team_id"
            name="assigned_team_id"
            value={teamValue}
            onChange={(event) => setTeamValue(event.target.value)}
            className={`mt-1 ${FIELD}`}
          >
            <option value="">No team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
            <option value={CREATE_TEAM}>+ Create a new team</option>
          </select>
          {selectedTeam && (
            <FieldHint>{memberNames.length > 0 ? `Members: ${memberNames.join(", ")}` : "This team has no members yet."}</FieldHint>
          )}
        </div>
      </div>

      {creatingTeam && (
        <div className="space-y-4 rounded-xl border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">New team</p>
          <TextField label="Team name" name="new_team_name" required placeholder="e.g. Frontend squad" />
          <div>
            <FieldLabel>Members</FieldLabel>
            <div className="mt-2">
              <PeoplePicker people={developers} name="new_team_members" />
            </div>
          </div>
          <FieldHint>It will be added to the Team page when you save this project.</FieldHint>
        </div>
      )}
    </div>
  );
}

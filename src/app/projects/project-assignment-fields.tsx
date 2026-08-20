"use client";

import { useState } from "react";
import { FIELD, FIELD_LABEL } from "@/lib/field-styles";

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

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="assigned_to" className={FIELD_LABEL}>
          Assigned developer
        </label>
        <select id="assigned_to" name="assigned_to" defaultValue={assignedTo ?? ""} className={`mt-1 ${FIELD}`}>
          <option value="">— Unassigned —</option>
          {developers.map((developer) => (
            <option key={developer.id} value={developer.id}>
              {developer.full_name || developer.email}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Choose Unassigned to remove a developer from this project.</p>
      </div>

      <div>
        <label htmlFor="assigned_team_id" className={FIELD_LABEL}>
          Assigned team
        </label>
        <select
          id="assigned_team_id"
          name="assigned_team_id"
          value={teamValue}
          onChange={(event) => setTeamValue(event.target.value)}
          className={`mt-1 ${FIELD}`}
        >
          <option value="">— No team —</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
          <option value={CREATE_TEAM}>+ Create new team</option>
        </select>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Choose No team to unassign the current team.</p>
      </div>

      {selectedTeam && selectedTeam.member_ids.length > 0 && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Members:{" "}
          {selectedTeam.member_ids
            .map((id) => {
              const member = developers.find((developer) => developer.id === id);
              return member?.full_name || member?.email || "Unknown";
            })
            .join(", ")}
        </p>
      )}

      {creatingTeam && (
        <div className="space-y-3 rounded-xl border border-dashed border-zinc-300 p-3 dark:border-zinc-700">
          <div>
            <label htmlFor="new_team_name" className={FIELD_LABEL}>
              New team name
            </label>
            <input id="new_team_name" name="new_team_name" required placeholder="Frontend squad" className={`mt-1 ${FIELD}`} />
          </div>
          <fieldset>
            <legend className={FIELD_LABEL}>Team members</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {developers.map((developer) => (
                <label key={developer.id} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <input type="checkbox" name="new_team_members" value={developer.id} className="rounded border-zinc-300" />
                  {developer.full_name || developer.email}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      )}
    </div>
  );
}

import type { AssignmentTeam } from "@/app/projects/project-assignment-fields";
import type { createClient } from "@/lib/supabase/server";

export async function fetchAssignmentTeams(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<AssignmentTeam[]> {
  const { data, error } = await supabase
    .from("teams")
    .select("id, name, team_members(profile_id)")
    .order("name");

  if (error) return [];

  return (data ?? []).map((team) => ({
    id: team.id,
    name: team.name,
    member_ids: (team.team_members ?? []).map((member) => member.profile_id),
  }));
}

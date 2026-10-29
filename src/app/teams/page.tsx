import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { createTeam, deleteTeam } from "./actions";
import { DeleteButton } from "@/components/delete-button";
import { Avatar } from "@/components/ui/avatar";
import { SubmitButton } from "@/components/ui/submit-button";
import { CARD } from "@/lib/card-styles";
import { FieldLabel, FormError, TextField } from "@/components/form/fields";
import { PeoplePicker } from "@/components/form/people-picker";
import { PageHeading } from "@/components/page-heading";
import Link from "next/link";

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, profile, supabase] = await Promise.all([searchParams, getCurrentProfile(), createClient()]);
  if (!profile) return null;
  const isAdmin = profile.role === "admin";

  const [{ data: teams, error: teamsError }, { data: developers }, { data: assignedProjects }] = await Promise.all([
    supabase
      .from("teams")
      .select("id, name, created_at, team_members(profile:profiles(id, full_name, email))")
      .order("name"),
    supabase.from("profiles").select("id, full_name, email").order("full_name"),
    supabase.from("projects").select("id, name, assigned_team_id").not("assigned_team_id", "is", null),
  ]);

  if (teamsError) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 sm:py-8">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Team</h1>
        <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          The teams tables are not in your Supabase database yet. Open the SQL editor and run{" "}
          <code className="font-mono">supabase/migrations/0005_teams.sql</code>.
        </p>
      </div>
    );
  }

  const projectsByTeam = new Map<string, { id: string; name: string }[]>();
  for (const project of assignedProjects ?? []) {
    if (!project.assigned_team_id) continue;
    const list = projectsByTeam.get(project.assigned_team_id) ?? [];
    list.push({ id: project.id, name: project.name });
    projectsByTeam.set(project.assigned_team_id, list);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 sm:py-8">
      <PageHeading
        title="Team"
        description="People grouped for project assignment."
      />

      {error && (
        <div className="mt-4">
          <FormError message={error} />
        </div>
      )}

      {isAdmin && (
        <section className={`${CARD} mt-6 p-5`}>
          <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Create a team</h2>
          <form action={createTeam} className="space-y-4">
            <TextField label="Team name" name="name" required placeholder="e.g. Frontend squad" />
            <div>
              <FieldLabel>Members</FieldLabel>
              <div className="mt-2">
                <PeoplePicker people={developers ?? []} name="members" />
              </div>
            </div>
            <div className="flex justify-end">
              <SubmitButton pendingLabel="Creating…" className="w-full sm:w-auto">
                Create team
              </SubmitButton>
            </div>
          </form>
        </section>
      )}

      <section className="mt-8 space-y-3">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Teams</h2>
        {!teams || teams.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No teams yet.</p>
        ) : (
          teams.map((team) => {
            const members = (team.team_members ?? [])
              .map((row) => (Array.isArray(row.profile) ? row.profile[0] : row.profile))
              .filter((member): member is { id: string; full_name: string; email: string } => Boolean(member));
            const projects = projectsByTeam.get(team.id) ?? [];
            return (
              <div key={team.id} className={`${CARD} p-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-50">{team.name}</h3>
                    {members.length === 0 ? (
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">No members yet.</p>
                    ) : (
                      <ul className="mt-2 space-y-1">
                        {members.map((member) => (
                          <li key={member.id} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                            <Avatar name={member.full_name || member.email} size="sm" />
                            {member.full_name || member.email}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Assigned projects</p>
                      {projects.length === 0 ? (
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">None yet.</p>
                      ) : (
                        <ul className="mt-1 space-y-1">
                          {projects.map((project) => (
                            <li key={project.id}>
                              <Link
                                href={`/projects/${project.id}`}
                                className="text-sm font-medium text-accent-600 hover:underline dark:text-accent-500"
                              >
                                {project.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <DeleteButton
                      action={deleteTeam.bind(null, team.id)}
                      confirmMessage={`Delete team "${team.name}"?`}
                      label="Delete team"
                      className="shrink-0"
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}

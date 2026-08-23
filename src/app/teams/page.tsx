import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { createTeam, deleteTeam } from "./actions";
import { DeleteButton } from "@/components/delete-button";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CARD } from "@/lib/card-styles";
import { FIELD, FIELD_LABEL } from "@/lib/field-styles";
import { PageHeading } from "@/components/page-heading";

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/");

  const supabase = await createClient();
  const [{ data: teams, error: teamsError }, { data: developers }] = await Promise.all([
    supabase
      .from("teams")
      .select("id, name, created_at, team_members(profile:profiles(id, full_name, email))")
      .order("name"),
    supabase.from("profiles").select("id, full_name, email").order("full_name"),
  ]);

  if (teamsError) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Teams</h1>
        <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          The teams tables are not in your Supabase database yet. Open the SQL editor and run{" "}
          <code className="font-mono">supabase/migrations/0005_teams.sql</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <PageHeading
        kicker="Team"
        title="Teams"
        description="Group developers, then assign a team when you create or edit a project."
      />

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>
      )}

      <section className={`${CARD} mt-6 p-5`}>
        <h2 className="mb-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">Create a team</h2>
        <form action={createTeam} className="space-y-4">
          <div>
            <label htmlFor="name" className={FIELD_LABEL}>
              Team name
            </label>
            <input id="name" name="name" required placeholder="Frontend squad" className={`mt-1 ${FIELD}`} />
          </div>
          <fieldset>
            <legend className={FIELD_LABEL}>Members</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {(developers ?? []).map((developer) => (
                <label key={developer.id} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <input type="checkbox" name="members" value={developer.id} className="rounded border-zinc-300" />
                  {developer.full_name || developer.email}
                </label>
              ))}
            </div>
          </fieldset>
          <Button type="submit" variant="primary">
            Create team
          </Button>
        </form>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Existing teams</h2>
        {!teams || teams.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No teams yet.</p>
        ) : (
          teams.map((team) => {
            const members = (team.team_members ?? [])
              .map((row) => (Array.isArray(row.profile) ? row.profile[0] : row.profile))
              .filter((member): member is { id: string; full_name: string; email: string } => Boolean(member));
            return (
              <div key={team.id} className={`${CARD} p-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
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
                  </div>
                  <DeleteButton
                    action={deleteTeam.bind(null, team.id)}
                    confirmMessage={`Delete team "${team.name}"?`}
                    label="Delete team"
                  />
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}

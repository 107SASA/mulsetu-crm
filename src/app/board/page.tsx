import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { PipelineBoard, type BoardProject } from "./pipeline-board";
import { readAssignedTeam } from "@/lib/teams";
import { PageHeading } from "@/components/page-heading";

export default async function BoardPage() {
  const [profile, supabase] = await Promise.all([getCurrentProfile(), createClient()]);
  const isAdmin = profile?.role === "admin";

  const withTeam = await supabase
    .from("projects")
    .select(
      "id, name, stage, priority, deadline, client:clients(id, company_name), assignee:profiles!projects_assigned_to_fkey(full_name, email), team:teams!projects_assigned_team_id_fkey(id, name)"
    )
    .order("deadline", { ascending: true, nullsFirst: false });

  const { data: projects } = withTeam.error
    ? await supabase
        .from("projects")
        .select(
          "id, name, stage, priority, deadline, client:clients(id, company_name), assignee:profiles!projects_assigned_to_fkey(full_name, email)"
        )
        .order("deadline", { ascending: true, nullsFirst: false })
    : withTeam;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <PageHeading
        kicker="Work"
        title="Pipeline"
        description="Projects grouped by stage."
        actions={
          <Link href="/projects" className="text-sm font-medium text-accent-600 hover:underline dark:text-accent-500">
            View as list
          </Link>
        }
      />

      <PipelineBoard
        projects={((projects ?? []) as Array<Omit<BoardProject, "team"> & { team?: unknown }>).map((project) => ({
          ...project,
          team: readAssignedTeam(project.team),
        }))}
        isAdmin={Boolean(isAdmin)}
      />
    </div>
  );
}

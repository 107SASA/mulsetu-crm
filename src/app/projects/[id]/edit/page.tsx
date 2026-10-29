import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { deleteProjectRecord, updateProjectRecord } from "../../actions";
import { ProjectForm } from "../../project-form";
import { DangerZone, FormPage } from "@/components/form/fields";
import { DeleteButton } from "@/components/delete-button";
import { fetchAssignmentTeams } from "@/lib/teams";

export default async function EditProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ id }, { error }, profile, supabase] = await Promise.all([
    params,
    searchParams,
    getCurrentProfile(),
    createClient(),
  ]);
  if (!profile || profile.role !== "admin") redirect(`/projects/${id}`);

  const [{ data: project }, { data: clients }, { data: developers }, teams] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).single(),
    supabase.from("clients").select("id, company_name").order("company_name"),
    supabase.from("profiles").select("id, full_name, email").order("full_name"),
    fetchAssignmentTeams(supabase),
  ]);
  if (!project) notFound();

  return (
    <FormPage
      backHref={`/projects/${id}`}
      backLabel={project.name}
      title="Edit project"
      footer={
        <DangerZone description="Deletes the project with all of its tasks, meetings, and links.">
          <DeleteButton
            action={deleteProjectRecord.bind(null, id)}
            label="Delete project"
            confirmMessage={`Delete "${project.name}"? This cannot be undone.`}
            className=""
          />
        </DangerZone>
      }
    >
      <ProjectForm
        action={updateProjectRecord.bind(null, id)}
        clients={clients ?? []}
        developers={developers ?? []}
        teams={teams}
        defaults={project}
        error={error}
        submitLabel="Save changes"
        cancelHref={`/projects/${id}`}
      />
    </FormPage>
  );
}

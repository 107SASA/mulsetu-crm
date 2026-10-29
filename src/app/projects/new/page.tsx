import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { createProjectRecord } from "../actions";
import { ProjectForm } from "../project-form";
import { FormPage } from "@/components/form/fields";
import { fetchAssignmentTeams } from "@/lib/teams";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; type?: string; error?: string }>;
}) {
  const [{ client, type, error }, profile, supabase] = await Promise.all([
    searchParams,
    getCurrentProfile(),
    createClient(),
  ]);
  if (!profile || profile.role !== "admin") {
    redirect("/projects");
  }

  const [{ data: clients }, { data: developers }, teams] = await Promise.all([
    supabase.from("clients").select("id, company_name").order("company_name"),
    supabase.from("profiles").select("id, full_name, email").order("full_name"),
    fetchAssignmentTeams(supabase),
  ]);

  const backHref = client ? `/clients/${client}` : "/projects";

  return (
    <FormPage
      backHref={backHref}
      backLabel={client ? "Back to client" : "All projects"}
      title="New project"
      description="Client work or an internal product. You can change any of this later."
    >
      <ProjectForm
        action={createProjectRecord}
        clients={clients ?? []}
        developers={developers ?? []}
        teams={teams}
        defaults={{ client_id: client, project_type: type === "internal" ? "internal" : "client" }}
        error={error}
        submitLabel="Create project"
        pendingLabel="Creating…"
        cancelHref={backHref}
      />
    </FormPage>
  );
}

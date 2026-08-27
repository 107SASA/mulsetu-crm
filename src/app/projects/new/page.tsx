import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { createProjectRecord } from "../actions";
import { ProjectForm } from "../project-form";
import { CARD } from "@/lib/card-styles";
import { fetchAssignmentTeams } from "@/lib/teams";
import { PageHeading } from "@/components/page-heading";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; error?: string }>;
}) {
  const { client, error } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    redirect("/projects");
  }

  const supabase = await createClient();
  const [{ data: clients }, { data: developers }, teams] = await Promise.all([
    supabase.from("clients").select("id, company_name").order("company_name"),
    supabase.from("profiles").select("id, full_name, email").order("full_name"),
    fetchAssignmentTeams(supabase),
  ]);

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-5 sm:px-6 sm:py-8">
      <PageHeading
        title="New project"
        description="Client work or an internal product — both live in Projects."
      />
      <div className={`${CARD} mt-6 p-5`}>
        <ProjectForm
          action={createProjectRecord}
          clients={clients ?? []}
          developers={developers ?? []}
          teams={teams}
          defaults={{
            client_id: client,
            project_type: client ? "client" : clients && clients.length > 0 ? "client" : "internal",
          }}
          error={error}
          submitLabel="Create project"
          showBudget
        />
      </div>
    </div>
  );
}

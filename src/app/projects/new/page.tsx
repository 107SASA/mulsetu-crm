import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { createProjectRecord } from "../actions";
import { ProjectForm } from "../project-form";
import { CARD } from "@/lib/card-styles";
import { fetchAssignmentTeams } from "@/lib/teams";

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

  if (!clients || clients.length === 0) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-8 sm:px-6">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">New project</h1>
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          You need at least one client before you can create a project.{" "}
          <Link href="/clients/new" className="font-medium text-accent-600 underline dark:text-accent-500">
            Add a client first
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8 sm:px-6">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">New project</h1>
      <div className={`${CARD} mt-6 p-5`}>
        <ProjectForm
          action={createProjectRecord}
          clients={clients}
          developers={developers ?? []}
          teams={teams}
          defaults={{ client_id: client }}
          error={error}
          submitLabel="Create project"
          showBudget
        />
      </div>
    </div>
  );
}

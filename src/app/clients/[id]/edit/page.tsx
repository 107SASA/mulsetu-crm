import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { deleteClientRecord, updateClientRecord } from "../../actions";
import { ClientForm } from "../../client-form";
import { DangerZone, FormPage } from "@/components/form/fields";
import { DeleteButton } from "@/components/delete-button";

export default async function EditClientPage({
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
  if (!profile || profile.role !== "admin") redirect(`/clients/${id}`);

  const { data: client } = await supabase.from("clients").select("*").eq("id", id).single();
  if (!client) notFound();

  return (
    <FormPage
      backHref={`/clients/${id}`}
      backLabel={client.company_name}
      title="Edit client"
      footer={
        <DangerZone description="Deletes the client with all of its projects, tasks, and links.">
          <DeleteButton
            action={deleteClientRecord.bind(null, id)}
            label="Delete client"
            confirmMessage={`Delete ${client.company_name} and all of its projects? This cannot be undone.`}
            className=""
          />
        </DangerZone>
      }
    >
      <ClientForm
        action={updateClientRecord.bind(null, id)}
        defaults={client}
        error={error}
        submitLabel="Save changes"
        cancelHref={`/clients/${id}`}
      />
    </FormPage>
  );
}

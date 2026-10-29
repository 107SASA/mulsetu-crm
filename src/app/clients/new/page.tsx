import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { createClientRecord } from "../actions";
import { ClientForm } from "../client-form";
import { FormPage } from "@/components/form/fields";

export default async function NewClientPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, profile] = await Promise.all([searchParams, getCurrentProfile()]);
  if (!profile || profile.role !== "admin") {
    redirect("/clients");
  }

  return (
    <FormPage backHref="/clients" backLabel="All clients" title="New client" description="Add a company you work with.">
      <ClientForm
        action={createClientRecord}
        error={error}
        submitLabel="Create client"
        pendingLabel="Creating…"
        cancelHref="/clients"
      />
    </FormPage>
  );
}

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { DangerZone, FormPage } from "@/components/form/fields";
import { DeleteButton } from "@/components/delete-button";
import { fetchProducts } from "@/lib/products";
import { deleteLead, updateLead } from "../../actions";
import { LeadForm } from "../../lead-form";

export default async function EditLeadPage({
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
  if (!profile) return null;
  const isAdmin = profile.role === "admin";

  const [{ data: lead }, products, { data: people }] = await Promise.all([
    supabase.from("leads").select("*").eq("id", id).single(),
    fetchProducts(supabase),
    isAdmin ? supabase.from("profiles").select("id, full_name, email").order("full_name") : Promise.resolve({ data: null }),
  ]);
  if (!lead) notFound();

  return (
    <FormPage
      backHref={`/leads/${id}`}
      backLabel={lead.contact_name}
      title="Edit lead"
      footer={
        isAdmin ? (
          <DangerZone description="Removes the lead. Clients or projects created from it are kept.">
            <DeleteButton
              action={deleteLead.bind(null, id)}
              label="Delete lead"
              confirmMessage={`Delete the lead for ${lead.contact_name}?`}
              className=""
            />
          </DangerZone>
        ) : undefined
      }
    >
      <LeadForm
        action={updateLead.bind(null, id)}
        products={products}
        people={people ?? [profile]}
        isAdmin={isAdmin}
        currentUserId={profile.id}
        defaults={lead}
        error={error}
        mode="edit"
        cancelHref={`/leads/${id}`}
      />
    </FormPage>
  );
}

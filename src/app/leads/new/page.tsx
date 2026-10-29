import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { FormPage } from "@/components/form/fields";
import { fetchProducts } from "@/lib/products";
import { LEAD_SOURCES } from "@/lib/leads";
import { createLead } from "../actions";
import { LeadForm } from "../lead-form";

export default async function NewLeadPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; detail?: string; interest?: string; product?: string; n?: string; error?: string }>;
}) {
  const [params, profile, supabase] = await Promise.all([searchParams, getCurrentProfile(), createClient()]);
  if (!profile) return null;
  const isAdmin = profile.role === "admin";

  const [products, { data: people }] = await Promise.all([
    fetchProducts(supabase),
    isAdmin ? supabase.from("profiles").select("id, full_name, email").order("full_name") : Promise.resolve({ data: null }),
  ]);

  const source = LEAD_SOURCES.some((s) => s.value === params.source) ? params.source : undefined;

  return (
    <FormPage
      backHref="/leads"
      backLabel="All leads"
      title="Add a lead"
      description="Capture the contact now, fill in the rest later."
    >
      <LeadForm
        // A fresh form after every "Save & add another".
        key={params.n ?? "first"}
        action={createLead}
        products={products}
        people={people ?? [profile]}
        isAdmin={isAdmin}
        currentUserId={profile.id}
        defaults={{
          source,
          source_detail: params.detail,
          interest: params.interest === "product" || params.product ? "product" : undefined,
          product_id: params.product,
        }}
        error={params.error}
        mode="create"
        cancelHref="/leads"
      />
    </FormPage>
  );
}

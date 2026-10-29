import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button-link";
import { FormError } from "@/components/form/fields";
import { personName } from "@/components/form/people-picker";
import { CARD } from "@/lib/card-styles";
import { buttonClasses } from "@/lib/button-styles";
import { NEW_CLIENT } from "@/lib/client-constants";
import { fetchProducts } from "@/lib/products";
import { LEADS_SETUP_MESSAGE, isMissingTable, sourceText, whatsappNumber } from "@/lib/leads";
import { convertLead } from "../actions";
import { ConvertLeadForm } from "../convert-lead-form";
import { LeadStatusSelect } from "../lead-status-select";

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";
}

export default async function LeadDetailPage({
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

  const [{ data: lead, error: leadError }, { data: clients }, products] = await Promise.all([
    supabase
      .from("leads")
      .select(
        "*, product:projects!leads_product_id_fkey(id, name), owner:profiles!leads_owner_id_fkey(full_name, email), creator:profiles!leads_created_by_fkey(full_name, email), converted_client:clients!leads_converted_client_id_fkey(id, company_name), converted_project:projects!leads_converted_project_id_fkey(id, name, project_type)"
      )
      .eq("id", id)
      .single(),
    isAdmin ? supabase.from("clients").select("id, company_name").order("company_name") : Promise.resolve({ data: null }),
    isAdmin ? fetchProducts(supabase) : Promise.resolve([]),
  ]);

  if (isMissingTable(leadError)) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <FormError message={LEADS_SETUP_MESSAGE} />
      </div>
    );
  }
  if (!lead) notFound();

  const canEdit = isAdmin || lead.owner_id === profile.id || lead.created_by === profile.id;
  const won = lead.status === "won";
  const companyName = lead.company_name || lead.contact_name;
  const matchingClient = (clients ?? []).find((c) => c.company_name.toLowerCase() === companyName.toLowerCase());
  const today = new Date().toISOString().slice(0, 10);
  const followUpDue = !won && lead.status !== "lost" && lead.follow_up_date && lead.follow_up_date <= today;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <Link href="/leads" className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
        ← All leads
      </Link>

      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar name={lead.contact_name} />
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{lead.contact_name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              {lead.company_name && <span>{lead.company_name}</span>}
              <LeadStatusSelect key={lead.status} leadId={lead.id} status={lead.status} />
            </div>
          </div>
        </div>
        {canEdit && (
          <ButtonLink href={`/leads/${id}/edit`} variant="secondary" className="w-full shrink-0 sm:w-auto">
            Edit lead
          </ButtonLink>
        )}
      </div>

      {/* One-tap contact actions */}
      {(lead.phone || lead.email) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {lead.phone && (
            <>
              <a href={`tel:${lead.phone}`} className={buttonClasses("secondary", "sm")}>
                📞 Call
              </a>
              <a
                href={`https://wa.me/${whatsappNumber(lead.phone)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses("secondary", "sm")}
              >
                💬 WhatsApp
              </a>
            </>
          )}
          {lead.email && (
            <a href={`mailto:${lead.email}`} className={buttonClasses("secondary", "sm")}>
              ✉️ Email
            </a>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4">
          <FormError message={error} />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <section className={`${CARD} p-5`}>
            <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Interested in</h2>
            <p className="text-base font-medium text-zinc-900 dark:text-zinc-50">
              {lead.interest === "product" ? (
                lead.product ? (
                  <Link href={`/projects/${lead.product.id}`} className="text-accent-600 hover:underline dark:text-accent-500">
                    {lead.product.name}
                  </Link>
                ) : (
                  "One of our products"
                )
              ) : (
                "A custom project"
              )}
            </p>
            {lead.requirement ? (
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{lead.requirement}</p>
            ) : (
              <p className="mt-2 text-sm text-zinc-400">No details yet.</p>
            )}
          </section>

          {won ? (
            <section className={`${CARD} border-emerald-200 p-5 dark:border-emerald-900`}>
              <h2 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Converted 🎉</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">on {formatDate(lead.converted_at)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {lead.converted_client && (
                  <ButtonLink href={`/clients/${lead.converted_client.id}`} variant="secondary" size="sm">
                    Client: {lead.converted_client.company_name}
                  </ButtonLink>
                )}
                {lead.converted_project && (
                  <ButtonLink href={`/projects/${lead.converted_project.id}`} variant="secondary" size="sm">
                    {lead.converted_project.project_type === "internal" ? "Product" : "Project"}: {lead.converted_project.name}
                  </ButtonLink>
                )}
              </div>
            </section>
          ) : isAdmin && lead.status !== "lost" ? (
            <section className={`${CARD} p-5`}>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Convert this lead</h2>
              <p className="mb-4 mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                When they say yes: add them as a product customer, or create their project.
              </p>
              <ConvertLeadForm
                action={convertLead.bind(null, id)}
                interest={lead.interest}
                clients={clients ?? []}
                products={products}
                defaultClientId={matchingClient?.id ?? NEW_CLIENT}
                defaultProductId={lead.product_id}
                defaultProjectName={lead.company_name ? `${lead.company_name} project` : `${lead.contact_name}'s project`}
                newClientDefaults={{
                  company_name: companyName,
                  contact_name: lead.contact_name,
                  contact_email: lead.email,
                  contact_phone: lead.phone,
                }}
              />
            </section>
          ) : null}
        </div>

        <div className="min-w-0 space-y-6">
          <section className={`${CARD} p-5`}>
            <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Details</h2>
            <dl className="space-y-3 text-sm">
              <Row label="Source">{sourceText(lead.source, lead.source_detail)}</Row>
              <Row label="Follow up">
                <span className={followUpDue ? "text-amber-600 dark:text-amber-400" : undefined}>
                  {formatDate(lead.follow_up_date)}
                </span>
              </Row>
              <Row label="Owner">{lead.owner ? personName(lead.owner) : "—"}</Row>
              <Row label="Phone">{lead.phone || "—"}</Row>
              <Row label="Email">
                <span className="break-all">{lead.email || "—"}</span>
              </Row>
              <Row label="Added">
                {formatDate(lead.created_at)}
                {lead.creator && <span className="block text-xs font-normal text-zinc-500">by {personName(lead.creator)}</span>}
              </Row>
            </dl>
          </section>

          {lead.notes && (
            <section className={`${CARD} p-5`}>
              <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Internal notes</h2>
              <p className="whitespace-pre-line text-sm text-zinc-700 dark:text-zinc-300">{lead.notes}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="min-w-0 text-right font-medium text-zinc-900 dark:text-zinc-100">{children}</dd>
    </div>
  );
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { FormError } from "@/components/form/fields";
import { CARD_INTERACTIVE } from "@/lib/card-styles";
import { PageHeading } from "@/components/page-heading";

const CLOSED = new Set(["completed", "on_hold_cancelled"]);

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, profile, supabase] = await Promise.all([searchParams, getCurrentProfile(), createClient()]);
  const isAdmin = profile?.role === "admin";

  const base = "id, company_name, contact_name, contact_email, contact_phone, projects(id, stage)";
  const withProducts = await supabase
    .from("clients")
    .select(`${base}, product_customers(id, status)`)
    .order("company_name");
  // Before migration 0007 there is no product_customers table to embed.
  const { data: clients } = withProducts.error
    ? await supabase.from("clients").select(base).order("company_name")
    : withProducts;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <PageHeading
        title="Clients"
        description="Companies you build for and customers of your products."
        actions={
          isAdmin ? (
            <ButtonLink href="/clients/new" variant="primary" className="w-full sm:w-auto">
              + New client
            </ButtonLink>
          ) : undefined
        }
      />

      {error && (
        <div className="mt-4">
          <FormError message={error} />
        </div>
      )}

      {!clients || clients.length === 0 ? (
        <EmptyState
          icon="🏢"
          title="No clients yet."
          action={
            isAdmin ? (
              <ButtonLink href="/clients/new" variant="primary" size="sm">
                Add your first client
              </ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => {
            const projects = client.projects ?? [];
            const active = projects.filter((p) => !CLOSED.has(p.stage)).length;
            const productCount = (
              ("product_customers" in client ? client.product_customers : []) as { status: string }[]
            ).filter((c) => c.status !== "cancelled").length;
            return (
              <li key={client.id}>
                <Link href={`/clients/${client.id}`} className={`${CARD_INTERACTIVE} flex h-full flex-col p-4`}>
                  <div className="flex items-center gap-3">
                    <Avatar name={client.company_name} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">{client.company_name}</p>
                      <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                        {client.contact_name || client.contact_email || "No contact added"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3 border-t border-zinc-100 pt-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                    <span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{active}</span> active
                    </span>
                    <span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{projects.length}</span>
                      {projects.length === 1 ? " project" : " projects"}
                    </span>
                    {productCount > 0 && (
                      <span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{productCount}</span>
                        {productCount === 1 ? " product" : " products"}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

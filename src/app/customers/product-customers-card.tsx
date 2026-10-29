import Link from "next/link";
import type { Enums } from "@/lib/supabase/database.types";
import { CARD } from "@/lib/card-styles";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { SubmitButton } from "@/components/ui/submit-button";
import { DeleteButton } from "@/components/delete-button";
import { SelectField, TextField } from "@/components/form/fields";
import { ClientPicker } from "@/app/clients/client-picker";
import { CUSTOMER_STATUS_OPTIONS, LEADS_SETUP_MESSAGE, customerStatus } from "@/lib/leads";
import { addProductCustomer, removeProductCustomer } from "./actions";
import { CustomerStatusSelect } from "./customer-status-select";

export type ProductCustomer = {
  id: string;
  plan: string;
  status: Enums<"customer_status">;
  started_on: string | null;
  renewal_date: string | null;
  value: number | null;
  client: { id: string; company_name: string; contact_name: string } | null;
};

function shortDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : null;
}

// "Customers" section of an internal product's page: who uses it, on which
// plan, and their status — plus open leads interested in it.
export function ProductCustomersCard({
  productId,
  customers,
  clients,
  openLeads,
  isAdmin,
  setupMissing,
}: {
  productId: string;
  customers: ProductCustomer[];
  clients: { id: string; company_name: string }[];
  openLeads: number;
  isAdmin: boolean;
  setupMissing: boolean;
}) {
  const active = customers.filter((c) => c.status === "active" || c.status === "trial").length;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <section id="customers" className={`${CARD} scroll-mt-4 p-5`}>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Customers</h2>
        {!setupMissing && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {active} active · {customers.length} total
            {openLeads > 0 && (
              <>
                {" · "}
                <Link href="/leads?interest=product" className="text-accent-600 hover:underline dark:text-accent-500">
                  {openLeads} open {openLeads === 1 ? "lead" : "leads"}
                </Link>
              </>
            )}
          </span>
        )}
      </div>

      {setupMissing ? (
        <p className="text-sm text-amber-700 [overflow-wrap:anywhere] dark:text-amber-300">{LEADS_SETUP_MESSAGE}</p>
      ) : customers.length === 0 ? (
        <p className="text-sm text-zinc-400">No customers yet.</p>
      ) : (
        <ul className="-mx-2 divide-y divide-zinc-100 dark:divide-zinc-800">
          {customers.map((customer) => {
            const renewalSoon = customer.renewal_date && customer.renewal_date <= today;
            return (
              <li key={customer.id} className="flex flex-col gap-2 px-2 py-3 sm:flex-row sm:items-center sm:gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar name={customer.client?.company_name ?? "?"} size="sm" />
                  <div className="min-w-0">
                    {customer.client ? (
                      <Link
                        href={`/clients/${customer.client.id}`}
                        className="block truncate text-sm font-medium text-zinc-900 hover:text-accent-600 dark:text-zinc-50 dark:hover:text-accent-500"
                      >
                        {customer.client.company_name}
                      </Link>
                    ) : (
                      <span className="text-sm text-zinc-400">Deleted client</span>
                    )}
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {[
                        customer.plan || null,
                        customer.started_on ? `since ${shortDate(customer.started_on)}` : null,
                        customer.value != null ? Number(customer.value).toLocaleString() : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "No plan details"}
                    </p>
                    {customer.renewal_date && (
                      <p className={`text-xs ${renewalSoon ? "font-medium text-amber-600 dark:text-amber-400" : "text-zinc-400"}`}>
                        Renews {shortDate(customer.renewal_date)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 pl-9 sm:pl-0">
                  {isAdmin ? (
                    <CustomerStatusSelect customerId={customer.id} status={customer.status} />
                  ) : (
                    <Badge tone={customerStatus(customer.status).tone}>{customerStatus(customer.status).label}</Badge>
                  )}
                  {isAdmin && (
                    <DeleteButton
                      action={removeProductCustomer.bind(null, productId, customer.id)}
                      label="Remove"
                      pendingLabel="…"
                      confirmMessage={`Remove ${customer.client?.company_name ?? "this customer"} from this product?`}
                      variant="danger-link"
                      className=""
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!setupMissing && (
        <div className="mt-4 flex flex-col gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          {isAdmin && (
            <details className="group">
              <summary className="cursor-pointer list-none text-sm font-medium text-accent-600 hover:underline dark:text-accent-500">
                + Add a customer
              </summary>
              <form action={addProductCustomer.bind(null, productId)} className="mt-4 space-y-4">
                <ClientPicker clients={clients} hint="It will be added to Clients as well." />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextField label="Plan" name="plan" placeholder="e.g. Pro, 10 users" optional />
                  <SelectField label="Status" name="customer_status" defaultValue="active" options={CUSTOMER_STATUS_OPTIONS} />
                  <TextField label="Started on" name="started_on" type="date" defaultValue={today} optional />
                  <TextField label="Renewal date" name="renewal_date" type="date" optional />
                  <TextField
                    label="Value"
                    name="value"
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    placeholder="Per year or one-time"
                    optional
                  />
                  <TextField label="Notes" name="notes" optional />
                </div>
                <div className="flex justify-end">
                  <SubmitButton pendingLabel="Adding…" className="w-full sm:w-auto">
                    Add customer
                  </SubmitButton>
                </div>
              </form>
            </details>
          )}
          <ButtonLink href={`/leads/new?product=${productId}`} variant="ghost" size="sm" className="self-start">
            + Capture a lead for this product
          </ButtonLink>
        </div>
      )}
    </section>
  );
}

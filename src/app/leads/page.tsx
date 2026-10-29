import Link from "next/link";
import Form from "next/form";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { PageHeading } from "@/components/page-heading";
import { ButtonLink } from "@/components/ui/button-link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/filter-bar";
import { FormError } from "@/components/form/fields";
import { personName } from "@/components/form/people-picker";
import { CARD } from "@/lib/card-styles";
import { FIELD } from "@/lib/field-styles";
import {
  LEAD_INTEREST_OPTIONS,
  LEAD_SOURCES,
  LEAD_STATUS_OPTIONS,
  LEADS_SETUP_MESSAGE,
  isMissingTable,
  leadStatus,
  sourceText,
} from "@/lib/leads";
import type { Enums } from "@/lib/supabase/database.types";

const OPEN: Enums<"lead_status">[] = ["new", "contacted", "qualified"];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function leadsHref(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) search.set(key, value);
  const query = search.toString();
  return query ? `/leads?${query}` : "/leads";
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; source?: string; interest?: string; owner?: string; q?: string; error?: string }>;
}) {
  const [params, profile, supabase] = await Promise.all([searchParams, getCurrentProfile(), createClient()]);
  if (!profile) return null;

  const [{ data: leads, error }, { data: people }] = await Promise.all([
    supabase
      .from("leads")
      .select(
        "id, contact_name, company_name, phone, email, interest, status, source, source_detail, follow_up_date, created_at, owner_id, product:projects!leads_product_id_fkey(id, name), owner:profiles!leads_owner_id_fkey(full_name, email)"
      )
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, email").order("full_name"),
  ]);

  const setupMissing = isMissingTable(error);
  const all = leads ?? [];
  const today = todayIso();

  // Status tabs count across the other filters, so the numbers match the list.
  const q = (params.q ?? "").trim().toLowerCase();
  const matchesFilters = (lead: (typeof all)[number]) =>
    (!params.source || lead.source === params.source) &&
    (!params.interest || lead.interest === params.interest) &&
    (!params.owner || lead.owner_id === params.owner) &&
    (!q ||
      [lead.contact_name, lead.company_name, lead.phone, lead.email, lead.source_detail].some((v) =>
        v?.toLowerCase().includes(q)
      ));
  const filtered = all.filter(matchesFilters);
  const statusTab = params.status === "all" || LEAD_STATUS_OPTIONS.some((s) => s.value === params.status) ? params.status! : "open";
  const visible = filtered.filter((lead) =>
    statusTab === "all" ? true : statusTab === "open" ? OPEN.includes(lead.status) : lead.status === statusTab
  );
  const count = (fn: (lead: (typeof all)[number]) => boolean) => filtered.filter(fn).length;
  const dueCount = filtered.filter((l) => OPEN.includes(l.status) && l.follow_up_date && l.follow_up_date <= today).length;

  const tabs = [
    { value: "open", label: "Open", count: count((l) => OPEN.includes(l.status)) },
    ...LEAD_STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label, count: count((l) => l.status === s.value) })),
    { value: "all", label: "All", count: filtered.length },
  ];
  const keep = { source: params.source, interest: params.interest, owner: params.owner, q: params.q };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <PageHeading
        title="Leads"
        description="Everyone who's shown interest, from expos, referrals, the website, and more."
        actions={
          <ButtonLink href="/leads/new" variant="primary" className="w-full sm:w-auto">
            + Add lead
          </ButtonLink>
        }
      />

      {(setupMissing || params.error) && (
        <div className="mt-4">
          <FormError message={setupMissing ? LEADS_SETUP_MESSAGE : params.error} />
        </div>
      )}

      {dueCount > 0 && (
        <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          {dueCount} {dueCount === 1 ? "lead needs" : "leads need"} a follow-up today or earlier.
        </p>
      )}

      {/* Status tabs */}
      <nav aria-label="Lead status" className="scroll-thin -mx-4 mt-5 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {tabs.map((tab) => {
          const active = statusTab === tab.value;
          return (
            <Link
              key={tab.value}
              href={leadsHref({ ...keep, status: tab.value === "open" ? undefined : tab.value })}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "bg-zinc-900 font-medium text-white dark:bg-white dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              {tab.label}
              <span className={`text-xs ${active ? "opacity-70" : "text-zinc-400"}`}>{tab.count}</span>
            </Link>
          );
        })}
      </nav>

      {/* Search + filters */}
      <div className="mt-4 flex flex-col gap-2 lg:flex-row lg:items-center">
        <Form action="/leads" className="w-full lg:max-w-xs">
          {Object.entries({ ...keep, q: undefined, status: params.status }).map(([key, value]) =>
            value ? <input key={key} type="hidden" name={key} value={value} /> : null
          )}
          <input
            type="search"
            name="q"
            defaultValue={params.q}
            placeholder="Search name, company, phone…"
            aria-label="Search leads"
            className={FIELD}
          />
        </Form>
        <Suspense>
          <FilterBar
            filters={[
              { name: "source", label: "Source", allLabel: "All sources", options: [...LEAD_SOURCES] },
              { name: "interest", label: "Interest", allLabel: "Any interest", options: LEAD_INTEREST_OPTIONS },
              {
                name: "owner",
                label: "Owner",
                allLabel: "Any owner",
                options: (people ?? []).map((p) => ({ value: p.id, label: personName(p) })),
              },
            ]}
          />
        </Suspense>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon="🎯"
          title={all.length === 0 ? "No leads yet. Add the first one — it takes 10 seconds." : "No leads match this view."}
          action={
            all.length === 0 && !setupMissing ? (
              <ButtonLink href="/leads/new" variant="primary" size="sm">
                + Add lead
              </ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <ul className={`${CARD} mt-5 divide-y divide-zinc-100 overflow-hidden dark:divide-zinc-800`}>
          {visible.map((lead) => {
            const status = leadStatus(lead.status);
            const followUpDue = OPEN.includes(lead.status) && lead.follow_up_date && lead.follow_up_date <= today;
            return (
              <li key={lead.id}>
                <Link
                  href={`/leads/${lead.id}`}
                  className="flex flex-col gap-2 px-4 py-3.5 transition-colors hover:bg-zinc-50 sm:flex-row sm:items-center sm:gap-4 dark:hover:bg-zinc-800/50"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar name={lead.contact_name} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                        {lead.contact_name}
                        {lead.company_name && <span className="font-normal text-zinc-500"> · {lead.company_name}</span>}
                      </p>
                      <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                        {lead.interest === "product" ? (lead.product?.name ?? "A product") : "Custom project"}
                        {" · "}
                        {sourceText(lead.source, lead.source_detail)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pl-11 text-xs sm:pl-0">
                    <Badge tone={status.tone}>{status.label}</Badge>
                    {followUpDue ? (
                      <span className="font-medium text-amber-600 dark:text-amber-400">
                        Follow up {lead.follow_up_date === today ? "today" : new Date(lead.follow_up_date!).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-zinc-400">{timeAgo(lead.created_at)}</span>
                    )}
                    {lead.owner && (
                      <span title={`Owner: ${personName(lead.owner)}`}>
                        <Avatar name={personName(lead.owner)} size="sm" />
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

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { CARD, CARD_INTERACTIVE } from "@/lib/card-styles";
import { PageHeading } from "@/components/page-heading";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [profile, supabase] = await Promise.all([getCurrentProfile(), createClient()]);
  const isAdmin = profile?.role === "admin";

  const { data: clients } = await supabase
    .from("clients")
    .select("id, company_name, contact_name, contact_email, contact_phone")
    .order("company_name");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <PageHeading
        title="Clients"
        description="Companies and the projects you do for them."
        actions={
          isAdmin ? (
            <ButtonLink href="/clients/new" variant="primary" size="sm">
              New client
            </ButtonLink>
          ) : undefined
        }
      />

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {!clients || clients.length === 0 ? (
        <EmptyState
          icon="👥"
          title={`No clients yet.${isAdmin ? " Click “+ New client” to add your first one." : ""}`}
        />
      ) : (
        <>
          {/* Mobile: card list */}
          <ul className="mt-6 space-y-3 sm:hidden">
            {clients.map((c) => (
              <li key={c.id}>
                <Link href={`/clients/${c.id}`} className={`${CARD_INTERACTIVE} flex items-center gap-3 p-4`}>
                  <Avatar name={c.company_name} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">{c.company_name}</p>
                    {c.contact_name && (
                      <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">{c.contact_name}</p>
                    )}
                    {c.contact_email && (
                      <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">{c.contact_email}</p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <div className={`${CARD} mt-6 hidden overflow-x-auto sm:block`}>
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                <tr>
                  <Th>Company</Th>
                  <Th>Contact</Th>
                  <Th>Email</Th>
                  <Th>Phone</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {clients.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-accent-50/50 dark:hover:bg-accent-100/5">
                    <td className="px-4 py-3 text-sm">
                      <Link href={`/clients/${c.id}`} className="flex items-center gap-2.5 font-medium text-zinc-900 hover:text-accent-600 dark:text-zinc-50 dark:hover:text-accent-500">
                        <Avatar name={c.company_name} size="sm" />
                        {c.company_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{c.contact_name || "—"}</td>
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{c.contact_email || "—"}</td>
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{c.contact_phone || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
      {children}
    </th>
  );
}

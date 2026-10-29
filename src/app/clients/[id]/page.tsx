import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button-link";
import { DeadlineBadge } from "@/components/deadline-badge";
import { FormError } from "@/components/form/fields";
import { CARD } from "@/lib/card-styles";
import { stageDotColor, stageLabel } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { customerStatus, sourceText } from "@/lib/leads";

const CLOSED = new Set(["completed", "on_hold_cancelled"]);

export default async function ClientDetailPage({
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
  const isAdmin = profile?.role === "admin";

  const [{ data: client }, { data: projects }, { data: products }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).single(),
    supabase
      .from("projects")
      .select("id, name, stage, priority, deadline")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    // Products this client uses (empty until migration 0007 is run).
    supabase
      .from("product_customers")
      .select("id, plan, status, renewal_date, product:projects(id, name)")
      .eq("client_id", id)
      .order("created_at"),
  ]);
  if (!client) notFound();

  const active = (projects ?? []).filter((p) => !CLOSED.has(p.stage));
  const closed = (projects ?? []).filter((p) => CLOSED.has(p.stage));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <Link href="/clients" className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
        ← All clients
      </Link>

      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={client.company_name} />
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {client.company_name}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {active.length} active · {projects?.length ?? 0} projects
              {products && products.length > 0 && ` · uses ${products.length} ${products.length === 1 ? "product" : "products"}`}
            </p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <ButtonLink href={`/clients/${id}/edit`} variant="secondary" className="flex-1 sm:flex-none">
              Edit client
            </ButtonLink>
            <ButtonLink href={`/projects/new?client=${id}`} variant="primary" className="flex-1 sm:flex-none">
              + New project
            </ButtonLink>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4">
          <FormError message={error} />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {products && products.length > 0 && (
            <section className={`${CARD} p-5`}>
              <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Products used</h2>
              <ul className="-mx-2">
                {products.map((row) => (
                  <li key={row.id}>
                    <Link
                      href={row.product ? `/projects/${row.product.id}` : "#"}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                    >
                      <span className="min-w-0 flex-1 truncate font-medium text-zinc-900 dark:text-zinc-50">
                        {row.product?.name ?? "Deleted product"}
                        {row.plan && <span className="font-normal text-zinc-500"> · {row.plan}</span>}
                      </span>
                      {row.renewal_date && (
                        <span className="hidden text-xs text-zinc-500 sm:inline">
                          Renews {new Date(row.renewal_date).toLocaleDateString()}
                        </span>
                      )}
                      <Badge tone={customerStatus(row.status).tone}>{customerStatus(row.status).label}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className={`${CARD} p-5`}>
            <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Custom projects</h2>
            {!projects || projects.length === 0 ? (
              <p className="text-sm text-zinc-400">No custom projects for this client yet.</p>
            ) : (
              <div className="space-y-5">
                {active.length > 0 && <ProjectList title="Active" projects={active} />}
                {closed.length > 0 && <ProjectList title="Completed & on hold" projects={closed} />}
              </div>
            )}
          </section>
        </div>

        <div className="min-w-0 space-y-6">
          <section className={`${CARD} p-5`}>
            <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Contact</h2>
            {!client.contact_name && !client.contact_email && !client.contact_phone ? (
              <p className="text-sm text-zinc-400">No contact details yet.</p>
            ) : (
              <div className="space-y-2 text-sm">
                {client.contact_name && (
                  <p className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-100">
                    <Avatar name={client.contact_name} size="sm" />
                    {client.contact_name}
                  </p>
                )}
                {client.contact_email && (
                  <a
                    href={`mailto:${client.contact_email}`}
                    className="flex items-center gap-2 truncate text-accent-600 hover:underline dark:text-accent-500"
                  >
                    <span aria-hidden>✉️</span>
                    {client.contact_email}
                  </a>
                )}
                {client.contact_phone && (
                  <a
                    href={`tel:${client.contact_phone}`}
                    className="flex items-center gap-2 text-accent-600 hover:underline dark:text-accent-500"
                  >
                    <span aria-hidden>📞</span>
                    {client.contact_phone}
                  </a>
                )}
              </div>
            )}
          </section>

          {"source" in client && client.source && (
            <section className={`${CARD} p-5`}>
              <h2 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Came from</h2>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{sourceText(client.source, client.source_detail)}</p>
            </section>
          )}

          <section className={`${CARD} p-5`}>
            <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Notes</h2>
            {client.notes ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{client.notes}</p>
            ) : (
              <p className="text-sm text-zinc-400">No notes.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function ProjectList({
  title,
  projects,
}: {
  title: string;
  projects: { id: string; name: string; stage: Parameters<typeof stageLabel>[0]; deadline: string | null }[];
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400">{title}</p>
      <ul className="-mx-2">
        {projects.map((p) => (
          <li key={p.id}>
            <Link
              href={`/projects/${p.id}`}
              className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${stageDotColor(p.stage)}`} aria-hidden />
              <span className="min-w-0 flex-1 truncate font-medium text-zinc-900 dark:text-zinc-50">{p.name}</span>
              <span className="hidden text-xs text-zinc-500 sm:inline">{stageLabel(p.stage)}</span>
              <span className="text-xs">
                <DeadlineBadge deadline={p.deadline} stage={p.stage} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

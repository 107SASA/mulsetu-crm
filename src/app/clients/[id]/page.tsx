import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { ClientForm } from "../client-form";
import { updateClientRecord, deleteClientRecord } from "../actions";
import { DeleteButton } from "@/components/delete-button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { CARD, CARD_INTERACTIVE } from "@/lib/card-styles";
import { stageLabel } from "@/lib/constants";

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const [profile, supabase] = await Promise.all([getCurrentProfile(), createClient()]);
  const isAdmin = profile?.role === "admin";

  const { data: client } = await supabase.from("clients").select("*").eq("id", id).single();
  if (!client) notFound();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, stage, priority, deadline")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  const updateAction = updateClientRecord.bind(null, id);
  const deleteAction = deleteClientRecord.bind(null, id);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Link href="/clients" className="text-sm text-zinc-500 hover:underline dark:text-zinc-400">
        ← All clients
      </Link>

      <div className="mt-2 flex items-center gap-3">
        <Avatar name={client.company_name} />
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{client.company_name}</h1>
      </div>

      <section className={`${CARD} mt-6 p-5`}>
        <h2 className="mb-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {isAdmin ? "Edit client" : "Client details"}
        </h2>
        {isAdmin ? (
          <ClientForm action={updateAction} defaults={client} error={error} submitLabel="Save changes" />
        ) : (
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <Detail label="Contact name" value={client.contact_name} />
            <Detail label="Contact email" value={client.contact_email} />
            <Detail label="Contact phone" value={client.contact_phone} />
            <div className="sm:col-span-2">
              <Detail label="Notes" value={client.notes} />
            </div>
          </dl>
        )}
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Projects</h2>
          {isAdmin && (
            <ButtonLink href={`/projects/new?client=${id}`} variant="ghost" size="sm">
              + New project
            </ButtonLink>
          )}
        </div>
        {!projects || projects.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">No projects for this client yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {projects.map((p) => (
              <li key={p.id}>
                <Link href={`/projects/${p.id}`} className={`${CARD_INTERACTIVE} flex items-center justify-between p-3 text-sm`}>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">{p.name}</span>
                  <Badge tone="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {stageLabel(p.stage)}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isAdmin && (
        <section className="mt-8 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <h2 className="text-sm font-medium text-red-600 dark:text-red-400">Danger zone</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Deleting a client also deletes all of their projects, tasks, and links.
          </p>
          <DeleteButton action={deleteAction} confirmMessage={`Delete ${client.company_name} and all of its projects? This cannot be undone.`} />
        </section>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-zinc-400">{label}</dt>
      <dd className="mt-0.5 text-zinc-900 dark:text-zinc-100">{value || "—"}</dd>
    </div>
  );
}

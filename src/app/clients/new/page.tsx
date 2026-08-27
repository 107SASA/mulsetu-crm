import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { createClientRecord } from "../actions";
import { ClientForm } from "../client-form";
import { CARD } from "@/lib/card-styles";

export default async function NewClientPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    redirect("/clients");
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-5 sm:px-6 sm:py-8">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">New client</h1>
      <div className={`${CARD} mt-6 p-5`}>
        <ClientForm action={createClientRecord} error={error} submitLabel="Create client" />
      </div>
    </div>
  );
}

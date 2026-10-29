"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { readClientFields } from "@/lib/clients";
import { withNotice, withParam } from "@/lib/flash";

function fail(path: string, message: string): never {
  redirect(withParam(path, "error", message));
}

async function requireAdmin(errorPath: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") fail(errorPath, "Only admins can manage clients.");
  return profile;
}

// Client names show up on projects, the board, and the dashboard.
function revalidateClientViews(clientId?: string) {
  revalidatePath("/");
  revalidatePath("/clients");
  revalidatePath("/projects", "layout");
  if (clientId) revalidatePath(`/clients/${clientId}`, "layout");
}

export async function createClientRecord(formData: FormData) {
  const errorPath = "/clients/new";
  const profile = await requireAdmin(errorPath);

  const fields = readClientFields(formData);
  if (!fields.company_name) fail(errorPath, "Company name is required.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({ ...fields, created_by: profile.id })
    .select("id")
    .single();
  if (error || !data) fail(errorPath, error?.message ?? "Could not create the client.");

  revalidateClientViews();
  redirect(withNotice(`/clients/${data.id}`, "Client created"));
}

export async function updateClientRecord(clientId: string, formData: FormData) {
  const errorPath = `/clients/${clientId}/edit`;
  await requireAdmin(errorPath);

  const fields = readClientFields(formData);
  if (!fields.company_name) fail(errorPath, "Company name is required.");

  const supabase = await createClient();
  const { error } = await supabase.from("clients").update(fields).eq("id", clientId);
  if (error) fail(errorPath, error.message);

  revalidateClientViews(clientId);
  redirect(withNotice(`/clients/${clientId}`, "Changes saved"));
}

export async function deleteClientRecord(clientId: string) {
  const errorPath = `/clients/${clientId}/edit`;
  await requireAdmin(errorPath);

  const supabase = await createClient();
  const { error } = await supabase.from("clients").delete().eq("id", clientId);
  if (error) fail(errorPath, error.message);

  revalidateClientViews();
  redirect(withNotice("/clients", "Client deleted"));
}

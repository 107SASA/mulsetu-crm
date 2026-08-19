"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";

function readClientFields(formData: FormData) {
  return {
    company_name: String(formData.get("company_name") ?? "").trim(),
    contact_name: String(formData.get("contact_name") ?? "").trim(),
    contact_email: String(formData.get("contact_email") ?? "").trim(),
    contact_phone: String(formData.get("contact_phone") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
  };
}

export async function createClientRecord(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    redirect("/clients?error=" + encodeURIComponent("Only admins can add clients."));
  }

  const fields = readClientFields(formData);
  if (!fields.company_name) {
    redirect(
      "/clients/new?error=" + encodeURIComponent("Company name is required.")
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({ ...fields, created_by: profile!.id })
    .select("id")
    .single();

  if (error) {
    redirect("/clients/new?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/clients");
  redirect(`/clients/${data.id}`);
}

export async function updateClientRecord(clientId: string, formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    redirect(`/clients/${clientId}?error=` + encodeURIComponent("Only admins can edit clients."));
  }

  const fields = readClientFields(formData);
  if (!fields.company_name) {
    redirect(`/clients/${clientId}?error=` + encodeURIComponent("Company name is required."));
  }

  const supabase = await createClient();
  const { error } = await supabase.from("clients").update(fields).eq("id", clientId);

  if (error) {
    redirect(`/clients/${clientId}?error=` + encodeURIComponent(error.message));
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}`);
}

export async function deleteClientRecord(clientId: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    redirect(`/clients/${clientId}?error=` + encodeURIComponent("Only admins can delete clients."));
  }

  const supabase = await createClient();
  const { error } = await supabase.from("clients").delete().eq("id", clientId);

  if (error) {
    redirect(`/clients/${clientId}?error=` + encodeURIComponent(error.message));
  }

  revalidatePath("/clients");
  redirect("/clients");
}

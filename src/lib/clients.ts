import { redirect } from "next/navigation";
import type { createClient } from "@/lib/supabase/server";
import { NEW_CLIENT } from "@/lib/client-constants";
import { withParam } from "@/lib/flash";

// Reads client fields from a form. `prefix` lets other forms embed the same
// fields for creating a client inline (e.g. "new_client_company_name").
export function readClientFields(formData: FormData, prefix = "") {
  const read = (key: string) => String(formData.get(prefix + key) ?? "").trim();
  return {
    company_name: read("company_name"),
    contact_name: read("contact_name"),
    contact_email: read("contact_email"),
    contact_phone: read("contact_phone"),
    notes: read("notes"),
  };
}

// Validates the client <select> from ClientPicker before anything is written.
// Returns an error message, or null when the selection is usable.
export function clientSelectionError(formData: FormData) {
  const clientId = String(formData.get("client_id") ?? "");
  if (!clientId) return "Choose a client, or pick “Add a new client”.";
  if (clientId === NEW_CLIENT && !readClientFields(formData, "new_client_").company_name) {
    return "Enter the new client's company name.";
  }
  return null;
}

// Turns the ClientPicker selection into a client id, creating the client
// first when "Add a new client" was chosen. Server-only (call from actions).
export async function resolveClientId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clientId: string | null,
  formData: FormData,
  options: { createdBy: string; errorPath: string; source?: string; sourceDetail?: string }
) {
  if (clientId !== NEW_CLIENT) return clientId;

  const fields = readClientFields(formData, "new_client_");
  const base = { ...fields, created_by: options.createdBy };
  const withSource = options.source ? { ...base, source: options.source, source_detail: options.sourceDetail ?? "" } : base;

  let { data, error } = await supabase.from("clients").insert(withSource).select("id").single();
  // Databases without migration 0007 don't have the source columns yet.
  if (error && withSource !== base) {
    ({ data, error } = await supabase.from("clients").insert(base).select("id").single());
  }

  if (error || !data) redirect(withParam(options.errorPath, "error", error?.message ?? "Could not create the client."));
  return data.id;
}

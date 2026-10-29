"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { clientSelectionError, resolveClientId } from "@/lib/clients";
import { withNotice, withParam } from "@/lib/flash";
import { CUSTOMER_STATUS_OPTIONS, LEADS_SETUP_MESSAGE, isMissingTable } from "@/lib/leads";

function fail(path: string, message: string): never {
  redirect(withParam(path, "error", message));
}

function revalidateCustomerViews(productId: string, clientId?: string) {
  revalidatePath(`/projects/${productId}`);
  revalidatePath("/clients");
  if (clientId) revalidatePath(`/clients/${clientId}`);
  else revalidatePath("/clients/[id]", "page");
}

// Adds a customer to an internal product — an existing client, or a new one
// created with the same fields as the Clients page.
export async function addProductCustomer(productId: string, formData: FormData) {
  const errorPath = `/projects/${productId}`;
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") fail(errorPath, "Only admins can manage customers.");

  const clientError = clientSelectionError(formData);
  if (clientError) fail(errorPath, clientError);

  const read = (key: string) => String(formData.get(key) ?? "").trim();
  const status = CUSTOMER_STATUS_OPTIONS.find((s) => s.value === read("customer_status"))?.value ?? "active";
  const valueRaw = read("value");
  const value = valueRaw ? Number(valueRaw) : null;
  if (value != null && (Number.isNaN(value) || value < 0)) fail(errorPath, "Value must be a positive number.");
  const startedOn = read("started_on") || null;
  const renewalDate = read("renewal_date") || null;
  if (startedOn && renewalDate && renewalDate < startedOn) fail(errorPath, "The renewal date can't be before the start date.");

  const supabase = await createClient();
  const clientId = await resolveClientId(supabase, read("client_id"), formData, { createdBy: profile.id, errorPath });
  if (!clientId) fail(errorPath, "Choose a client.");

  const { error } = await supabase.from("product_customers").insert({
    product_id: productId,
    client_id: clientId,
    plan: read("plan"),
    status,
    started_on: startedOn,
    renewal_date: renewalDate,
    value,
    notes: read("notes"),
    created_by: profile.id,
  });
  if (error) {
    if (error.code === "23505") fail(errorPath, "That client is already a customer of this product.");
    fail(errorPath, isMissingTable(error) ? LEADS_SETUP_MESSAGE : error.message);
  }

  revalidateCustomerViews(productId, clientId);
  redirect(withNotice(errorPath, "Customer added"));
}

export async function updateProductCustomerStatus(customerId: string, status: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") return { error: "Only admins can manage customers." };
  const valid = CUSTOMER_STATUS_OPTIONS.find((s) => s.value === status)?.value;
  if (!valid) return { error: "Unknown status." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_customers")
    .update({ status: valid })
    .eq("id", customerId)
    .select("product_id, client_id")
    .single();
  if (error) return { error: error.message };

  revalidateCustomerViews(data.product_id, data.client_id);
  return { error: null };
}

export async function removeProductCustomer(productId: string, customerId: string) {
  const errorPath = `/projects/${productId}`;
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") fail(errorPath, "Only admins can manage customers.");

  const supabase = await createClient();
  const { error } = await supabase.from("product_customers").delete().eq("id", customerId);
  if (error) fail(errorPath, error.message);

  revalidateCustomerViews(productId);
  redirect(withNotice(errorPath, "Customer removed"));
}

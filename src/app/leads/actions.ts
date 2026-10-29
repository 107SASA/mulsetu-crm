"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import type { Enums } from "@/lib/supabase/database.types";
import { clientSelectionError, resolveClientId } from "@/lib/clients";
import { withNotice, withParam } from "@/lib/flash";
import { CUSTOMER_STATUS_OPTIONS, LEAD_SOURCES, LEAD_STATUS_OPTIONS, LEADS_SETUP_MESSAGE, isMissingTable } from "@/lib/leads";

function fail(path: string, message: string): never {
  redirect(withParam(path, "error", message));
}

function errorMessage(error: { code?: string; message?: string }) {
  return isMissingTable(error) ? LEADS_SETUP_MESSAGE : (error.message ?? "Something went wrong.");
}

function readLeadFields(formData: FormData) {
  const read = (key: string) => String(formData.get(key) ?? "").trim();
  const interest: Enums<"lead_interest"> = read("interest") === "product" ? "product" : "custom_project";
  const source = LEAD_SOURCES.some((s) => s.value === read("source")) ? read("source") : "other";
  return {
    contact_name: read("contact_name"),
    company_name: read("company_name"),
    email: read("email"),
    phone: read("phone"),
    interest,
    product_id: interest === "product" ? read("product_id") || null : null,
    requirement: read("requirement"),
    source,
    source_detail: read("source_detail"),
    owner_id: read("owner_id") || null,
    follow_up_date: read("follow_up_date") || null,
  };
}

function validateLead(fields: ReturnType<typeof readLeadFields>, errorPath: string) {
  if (!fields.contact_name) fail(errorPath, "Enter the person's name.");
  if (!fields.phone && !fields.email) fail(errorPath, "Add a phone number or an email so you can follow up.");
}

function revalidateLeadViews(leadId?: string) {
  revalidatePath("/");
  revalidatePath("/leads");
  if (leadId) revalidatePath(`/leads/${leadId}`, "layout");
}

export async function createLead(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const errorPath = "/leads/new";
  const fields = readLeadFields(formData);
  validateLead(fields, errorPath);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      ...fields,
      // Non-admins always own the leads they capture.
      owner_id: profile.role === "admin" ? fields.owner_id : profile.id,
      created_by: profile.id,
    })
    .select("id")
    .single();
  if (error || !data) fail(errorPath, error ? errorMessage(error) : "Could not save the lead.");

  revalidateLeadViews();

  // "Save & add another" goes straight back to a blank form with the same
  // source and event filled in — ideal for a queue of people at an expo.
  if (formData.get("next") === "another") {
    const params = new URLSearchParams({ source: fields.source });
    if (fields.source_detail) params.set("detail", fields.source_detail);
    params.set("n", Date.now().toString(36)); // remounts the form so it starts blank
    redirect(withNotice(`/leads/new?${params}`, `Saved ${fields.contact_name}`));
  }
  redirect(withNotice(`/leads/${data.id}`, "Lead saved"));
}

export async function updateLead(leadId: string, formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const errorPath = `/leads/${leadId}/edit`;
  const fields = readLeadFields(formData);
  validateLead(fields, errorPath);
  const status = LEAD_STATUS_OPTIONS.find((s) => s.value === formData.get("status"))?.value;
  const notes = String(formData.get("notes") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ ...fields, notes, ...(status ? { status } : {}) })
    .eq("id", leadId);
  if (error) fail(errorPath, errorMessage(error));

  revalidateLeadViews(leadId);
  redirect(withNotice(`/leads/${leadId}`, "Changes saved"));
}

// Quick status change from the lead page / list. Returns a result instead of
// redirecting, like the task status dropdown.
export async function updateLeadStatus(leadId: string, status: string) {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Not signed in." };
  const valid = LEAD_STATUS_OPTIONS.find((s) => s.value === status)?.value;
  if (!valid || valid === "won") return { error: "Use “Convert” to mark a lead as won." };

  const supabase = await createClient();
  const { error } = await supabase.from("leads").update({ status: valid }).eq("id", leadId);
  if (error) return { error: errorMessage(error) };

  revalidateLeadViews(leadId);
  return { error: null };
}

export async function deleteLead(leadId: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") fail(`/leads/${leadId}`, "Only admins can delete leads.");

  const supabase = await createClient();
  const { error } = await supabase.from("leads").delete().eq("id", leadId);
  if (error) fail(`/leads/${leadId}/edit`, errorMessage(error));

  revalidateLeadViews();
  redirect(withNotice("/leads", "Lead deleted"));
}

// Turns a lead into a real client: either a customer of one of our products,
// or a client with a new custom project. The lead keeps a link to what it
// became, and the client remembers where it came from.
export async function convertLead(leadId: string, formData: FormData) {
  const errorPath = `/leads/${leadId}`;
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") fail(errorPath, "Only admins can convert leads.");

  const supabase = await createClient();
  const { data: lead, error: leadError } = await supabase.from("leads").select("*").eq("id", leadId).single();
  if (leadError || !lead) fail(errorPath, leadError ? errorMessage(leadError) : "Lead not found.");
  if (lead.status === "won") fail(errorPath, "This lead has already been converted.");

  const as = String(formData.get("convert_as") ?? lead.interest) === "product" ? "product" : "custom_project";
  const clientError = clientSelectionError(formData);
  if (clientError) fail(errorPath, clientError);

  const productId = String(formData.get("product_id") ?? "");
  const projectName = String(formData.get("project_name") ?? "").trim();
  if (as === "product" && !productId) fail(errorPath, "Choose which product they're buying.");
  if (as === "custom_project" && !projectName) fail(errorPath, "Give the new project a name.");

  const clientId = await resolveClientId(supabase, String(formData.get("client_id") ?? ""), formData, {
    createdBy: profile.id,
    errorPath,
    source: lead.source,
    sourceDetail: lead.source_detail,
  });
  if (!clientId) fail(errorPath, "Choose a client.");

  let projectId: string | null = null;
  let destination: string;

  if (as === "product") {
    const status = CUSTOMER_STATUS_OPTIONS.find((s) => s.value === formData.get("customer_status"))?.value ?? "active";
    const plan = String(formData.get("plan") ?? "").trim();
    const { error } = await supabase.from("product_customers").insert({
      product_id: productId,
      client_id: clientId,
      plan,
      status,
      started_on: new Date().toISOString().slice(0, 10),
      notes: lead.requirement,
      source_lead_id: lead.id,
      created_by: profile.id,
    });
    if (error && error.code !== "23505") fail(errorPath, errorMessage(error));
    projectId = productId;
    destination = withNotice(`/clients/${clientId}`, "Lead converted — customer added");
  } else {
    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        name: projectName,
        description: lead.requirement,
        client_id: clientId,
        project_type: "client",
        stage: "requirements",
        priority: "medium",
        assigned_to: lead.owner_id,
        created_by: profile.id,
      })
      .select("id")
      .single();
    if (error || !project) fail(errorPath, error ? errorMessage(error) : "Could not create the project.");
    projectId = project.id;
    destination = withNotice(`/projects/${project.id}`, "Lead converted — project created");
  }

  await supabase
    .from("leads")
    .update({
      status: "won",
      converted_client_id: clientId,
      converted_project_id: projectId,
      converted_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  revalidateLeadViews(leadId);
  revalidatePath("/clients", "layout");
  revalidatePath("/projects", "layout");
  redirect(destination);
}

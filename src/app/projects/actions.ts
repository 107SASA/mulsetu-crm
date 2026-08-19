"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import type { Enums } from "@/lib/supabase/database.types";
import { STAGE_OPTIONS, PRIORITY_OPTIONS } from "@/lib/constants";

function readProjectFields(formData: FormData) {
  const stage = String(formData.get("stage") ?? "incoming");
  const priority = String(formData.get("priority") ?? "medium");
  const budgetRaw = String(formData.get("budget") ?? "").trim();

  const validStage = STAGE_OPTIONS.some((s) => s.value === stage);
  const validPriority = PRIORITY_OPTIONS.some((p) => p.value === priority);

  return {
    client_id: String(formData.get("client_id") ?? ""),
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    stage: (validStage ? stage : "incoming") as Enums<"project_stage">,
    priority: (validPriority ? priority : "medium") as Enums<"priority_level">,
    start_date: String(formData.get("start_date") ?? "") || null,
    deadline: String(formData.get("deadline") ?? "") || null,
    budget: budgetRaw ? Number(budgetRaw) : null,
    assigned_to: String(formData.get("assigned_to") ?? "") || null,
  };
}

async function requireAdmin(redirectTo: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    redirect(redirectTo + "?error=" + encodeURIComponent("Only admins can manage projects."));
  }
  return profile!;
}

export async function createProjectRecord(formData: FormData) {
  await requireAdmin("/projects");

  const fields = readProjectFields(formData);
  if (!fields.name || !fields.client_id) {
    redirect(
      `/projects/new?client=${fields.client_id}&error=` +
        encodeURIComponent("Project name and client are required.")
    );
  }

  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { data, error } = await supabase
    .from("projects")
    .insert({ ...fields, created_by: profile!.id })
    .select("id")
    .single();

  if (error) {
    redirect(`/projects/new?client=${fields.client_id}&error=` + encodeURIComponent(error.message));
  }

  revalidatePath("/projects");
  redirect(`/projects/${data.id}`);
}

export async function updateProjectRecord(projectId: string, formData: FormData) {
  await requireAdmin(`/projects/${projectId}`);

  const fields = readProjectFields(formData);
  if (!fields.name || !fields.client_id) {
    redirect(`/projects/${projectId}?error=` + encodeURIComponent("Project name and client are required."));
  }

  const supabase = await createClient();
  const { error } = await supabase.from("projects").update(fields).eq("id", projectId);

  if (error) {
    redirect(`/projects/${projectId}?error=` + encodeURIComponent(error.message));
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}`);
}

export async function deleteProjectRecord(projectId: string) {
  await requireAdmin(`/projects/${projectId}`);

  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", projectId);

  if (error) {
    redirect(`/projects/${projectId}?error=` + encodeURIComponent(error.message));
  }

  revalidatePath("/projects");
  redirect("/projects");
}

export async function addProjectLink(projectId: string, formData: FormData) {
  await requireAdmin(`/projects/${projectId}`);

  const label = String(formData.get("label") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  if (!label || !url) {
    redirect(`/projects/${projectId}?error=` + encodeURIComponent("Link label and URL are both required."));
  }

  const supabase = await createClient();
  const { error } = await supabase.from("project_links").insert({ project_id: projectId, label, url });

  if (error) {
    redirect(`/projects/${projectId}?error=` + encodeURIComponent(error.message));
  }

  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}`);
}

export async function deleteProjectLink(projectId: string, linkId: string) {
  await requireAdmin(`/projects/${projectId}`);

  const supabase = await createClient();
  const { error } = await supabase.from("project_links").delete().eq("id", linkId);

  if (error) {
    redirect(`/projects/${projectId}?error=` + encodeURIComponent(error.message));
  }

  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}`);
}

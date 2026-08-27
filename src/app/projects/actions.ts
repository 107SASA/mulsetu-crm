"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import type { Enums } from "@/lib/supabase/database.types";
import { STAGE_OPTIONS, PRIORITY_OPTIONS } from "@/lib/constants";
import { readProjectType } from "@/lib/project-work";

function readProjectFields(formData: FormData) {
  const stage = String(formData.get("stage") ?? "incoming");
  const priority = String(formData.get("priority") ?? "medium");
  const budgetRaw = String(formData.get("budget") ?? "").trim();
  const projectType = readProjectType(formData.get("project_type"));

  const validStage = STAGE_OPTIONS.some((s) => s.value === stage);
  const validPriority = PRIORITY_OPTIONS.some((p) => p.value === priority);
  const clientId = projectType === "client" ? String(formData.get("client_id") ?? "").trim() : "";

  return {
    client_id: clientId || null,
    project_type: projectType,
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

const CREATE_TEAM = "__create__";
const INTERNAL_SETUP_ERROR =
  "Internal Products need a database update. Open the Supabase SQL editor and run supabase/migrations/0006_project_type.sql.";

async function resolveAssignedTeamId(
  formData: FormData,
  createdBy: string,
  errorRedirect: string
) {
  const assignedTeamId = String(formData.get("assigned_team_id") ?? "");
  if (!assignedTeamId) return null;
  if (assignedTeamId !== CREATE_TEAM) return assignedTeamId;

  const name = String(formData.get("new_team_name") ?? "").trim();
  const memberIds = formData.getAll("new_team_members").map(String).filter(Boolean);
  if (!name) {
    redirect(errorRedirect + "?error=" + encodeURIComponent("New team name is required."));
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teams")
    .insert({ name, created_by: createdBy })
    .select("id")
    .single();

  if (error || !data) {
    redirect(errorRedirect + "?error=" + encodeURIComponent(error?.message ?? "Could not create team."));
  }

  if (memberIds.length > 0) {
    const { error: membersError } = await supabase
      .from("team_members")
      .insert(memberIds.map((profile_id) => ({ team_id: data.id, profile_id })));
    if (membersError) {
      redirect(errorRedirect + "?error=" + encodeURIComponent(membersError.message));
    }
  }

  return data.id;
}

async function requireAdmin(redirectTo: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    redirect(redirectTo + "?error=" + encodeURIComponent("Only admins can manage projects."));
  }
  return profile!;
}

function saveErrorMessage(message: string, projectType: "client" | "internal") {
  if (projectType === "internal") return INTERNAL_SETUP_ERROR;
  if (/project_type|client_id/i.test(message)) return INTERNAL_SETUP_ERROR;
  return message;
}

export async function createProjectRecord(formData: FormData) {
  await requireAdmin("/projects");

  const fields = readProjectFields(formData);
  if (!fields.name) {
    redirect(`/projects/new?error=` + encodeURIComponent("Project name is required."));
  }
  if (fields.project_type === "client" && !fields.client_id) {
    redirect(`/projects/new?error=` + encodeURIComponent("Choose a client for a Client Project."));
  }

  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const assigned_team_id = await resolveAssignedTeamId(formData, profile!.id, "/projects/new");
  const payload = { ...fields, assigned_team_id, created_by: profile!.id };

  let { data, error } = await supabase.from("projects").insert(payload).select("id").single();

  if (error && fields.project_type === "client") {
    const { project_type: _projectType, ...withoutType } = payload;
    const retry = await supabase.from("projects").insert(withoutType).select("id").single();
    data = retry.data;
    error = retry.error;
  }

  if (error || !data) {
    redirect(
      `/projects/new?error=` +
        encodeURIComponent(saveErrorMessage(error?.message ?? "Could not create project.", fields.project_type))
    );
  }

  revalidatePath("/projects");
  revalidatePath("/teams");
  redirect(`/projects/${data.id}`);
}

export async function updateProjectRecord(projectId: string, formData: FormData) {
  await requireAdmin(`/projects/${projectId}`);

  const fields = readProjectFields(formData);
  if (!fields.name) {
    redirect(`/projects/${projectId}?error=` + encodeURIComponent("Project name is required."));
  }
  if (fields.project_type === "client" && !fields.client_id) {
    redirect(`/projects/${projectId}?error=` + encodeURIComponent("Choose a client for a Client Project."));
  }

  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const assigned_team_id = await resolveAssignedTeamId(formData, profile!.id, `/projects/${projectId}`);
  const payload = { ...fields, assigned_team_id };

  let { error } = await supabase.from("projects").update(payload).eq("id", projectId);

  if (error && fields.project_type === "client") {
    const { project_type: _projectType, ...withoutType } = payload;
    const retry = await supabase.from("projects").update(withoutType).eq("id", projectId);
    error = retry.error;
  }

  if (error) {
    redirect(
      `/projects/${projectId}?error=` + encodeURIComponent(saveErrorMessage(error.message, fields.project_type))
    );
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/teams");
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
    redirect(`/projects/${projectId}?tab=links&error=` + encodeURIComponent("Link label and URL are both required."));
  }

  const supabase = await createClient();
  const { error } = await supabase.from("project_links").insert({ project_id: projectId, label, url });

  if (error) {
    redirect(`/projects/${projectId}?tab=links&error=` + encodeURIComponent(error.message));
  }

  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}?tab=links`);
}

export async function deleteProjectLink(projectId: string, linkId: string) {
  await requireAdmin(`/projects/${projectId}`);

  const supabase = await createClient();
  const { error } = await supabase.from("project_links").delete().eq("id", linkId);

  if (error) {
    redirect(`/projects/${projectId}?tab=links&error=` + encodeURIComponent(error.message));
  }

  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}?tab=links`);
}

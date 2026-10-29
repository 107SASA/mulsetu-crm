"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import type { Enums } from "@/lib/supabase/database.types";
import { STAGE_OPTIONS, PRIORITY_OPTIONS } from "@/lib/constants";
import { readProjectType } from "@/lib/project-work";
import { clientSelectionError, resolveClientId } from "@/lib/clients";
import { withNotice, withParam } from "@/lib/flash";

const CREATE_TEAM = "__create__";
const INTERNAL_SETUP_ERROR =
  "Internal Products need a database update. Open the Supabase SQL editor and run supabase/migrations/0006_project_type.sql.";

type Supabase = Awaited<ReturnType<typeof createClient>>;

function fail(path: string, message: string): never {
  redirect(withParam(path, "error", message));
}

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

// Checks the form before anything is written, so a bad submission never
// leaves behind a half-created client or team.
function validateProjectFields(fields: ReturnType<typeof readProjectFields>, formData: FormData, errorPath: string) {
  if (!fields.name) fail(errorPath, "Project name is required.");
  if (fields.project_type === "client") {
    const clientError = clientSelectionError(formData);
    if (clientError) fail(errorPath, clientError);
  }
  if (String(formData.get("assigned_team_id") ?? "") === CREATE_TEAM && !String(formData.get("new_team_name") ?? "").trim()) {
    fail(errorPath, "Enter a name for the new team.");
  }
  if (fields.start_date && fields.deadline && fields.deadline < fields.start_date) {
    fail(errorPath, "The deadline can't be before the start date.");
  }
  if (fields.budget != null && (Number.isNaN(fields.budget) || fields.budget < 0)) {
    fail(errorPath, "Budget must be a positive number.");
  }
}

async function resolveAssignedTeamId(supabase: Supabase, formData: FormData, createdBy: string, errorPath: string) {
  const assignedTeamId = String(formData.get("assigned_team_id") ?? "");
  if (!assignedTeamId) return null;
  if (assignedTeamId !== CREATE_TEAM) return assignedTeamId;

  const name = String(formData.get("new_team_name") ?? "").trim();
  const memberIds = formData.getAll("new_team_members").map(String).filter(Boolean);

  const { data, error } = await supabase
    .from("teams")
    .insert({ name, created_by: createdBy })
    .select("id")
    .single();

  if (error || !data) fail(errorPath, error?.message ?? "Could not create the team.");

  if (memberIds.length > 0) {
    const { error: membersError } = await supabase
      .from("team_members")
      .insert(memberIds.map((profile_id) => ({ team_id: data.id, profile_id })));
    if (membersError) fail(errorPath, membersError.message);
  }

  return data.id;
}

async function requireAdmin(redirectTo: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") fail(redirectTo, "Only admins can manage projects.");
  return profile;
}

function saveErrorMessage(message: string) {
  if (/project_type/i.test(message)) return INTERNAL_SETUP_ERROR;
  return message;
}

function revalidateProjectViews(projectId?: string) {
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/clients", "layout");
  revalidatePath("/teams");
  if (projectId) revalidatePath(`/projects/${projectId}`, "layout");
}

export async function createProjectRecord(formData: FormData) {
  const errorPath = "/projects/new";
  const profile = await requireAdmin(errorPath);
  const fields = readProjectFields(formData);
  validateProjectFields(fields, formData, errorPath);

  const supabase = await createClient();
  const client_id = await resolveClientId(supabase, fields.client_id, formData, { createdBy: profile.id, errorPath });
  const assigned_team_id = await resolveAssignedTeamId(supabase, formData, profile.id, errorPath);
  const payload = { ...fields, client_id, assigned_team_id, created_by: profile.id };

  let { data, error } = await supabase.from("projects").insert(payload).select("id").single();

  if (error && fields.project_type === "client") {
    const { project_type: _projectType, ...withoutType } = payload;
    const retry = await supabase.from("projects").insert(withoutType).select("id").single();
    data = retry.data;
    error = retry.error;
  }

  if (error || !data) fail(errorPath, saveErrorMessage(error?.message ?? "Could not create the project."));

  revalidateProjectViews();
  redirect(withNotice(`/projects/${data.id}`, "Project created"));
}

export async function updateProjectRecord(projectId: string, formData: FormData) {
  const errorPath = `/projects/${projectId}/edit`;
  const profile = await requireAdmin(errorPath);
  const fields = readProjectFields(formData);
  validateProjectFields(fields, formData, errorPath);

  const supabase = await createClient();
  const client_id = await resolveClientId(supabase, fields.client_id, formData, { createdBy: profile.id, errorPath });
  const assigned_team_id = await resolveAssignedTeamId(supabase, formData, profile.id, errorPath);
  const payload = { ...fields, client_id, assigned_team_id };

  let { error } = await supabase.from("projects").update(payload).eq("id", projectId);

  if (error && fields.project_type === "client") {
    const { project_type: _projectType, ...withoutType } = payload;
    const retry = await supabase.from("projects").update(withoutType).eq("id", projectId);
    error = retry.error;
  }

  if (error) fail(errorPath, saveErrorMessage(error.message));

  revalidateProjectViews(projectId);
  redirect(withNotice(`/projects/${projectId}`, "Changes saved"));
}

export async function deleteProjectRecord(projectId: string) {
  const errorPath = `/projects/${projectId}/edit`;
  await requireAdmin(errorPath);

  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) fail(errorPath, error.message);

  revalidateProjectViews();
  redirect(withNotice("/projects", "Project deleted"));
}

function normalizeUrl(raw: string) {
  const value = raw.trim();
  if (!value) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

export async function addProjectLink(projectId: string, formData: FormData) {
  const projectPath = `/projects/${projectId}`;
  await requireAdmin(projectPath);

  const url = normalizeUrl(String(formData.get("url") ?? ""));
  if (!url) fail(projectPath, "Enter a valid link, e.g. drive.google.com/…");
  const label = String(formData.get("label") ?? "").trim() || url.hostname.replace(/^www\./, "");

  const supabase = await createClient();
  const { error } = await supabase.from("project_links").insert({ project_id: projectId, label, url: url.toString() });
  if (error) fail(projectPath, error.message);

  revalidatePath(projectPath);
  redirect(withNotice(projectPath, "Link added"));
}

export async function deleteProjectLink(projectId: string, linkId: string) {
  const projectPath = `/projects/${projectId}`;
  await requireAdmin(projectPath);

  const supabase = await createClient();
  const { error } = await supabase.from("project_links").delete().eq("id", linkId);
  if (error) fail(projectPath, error.message);

  revalidatePath(projectPath);
  redirect(withNotice(projectPath, "Link removed"));
}

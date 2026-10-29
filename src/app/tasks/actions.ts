"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from "@/lib/constants";
import type { Enums } from "@/lib/supabase/database.types";
import { withNotice, withParam } from "@/lib/flash";

// Where to send the user after a task change. Forms may pass a `return_to`
// (e.g. My Work with its date/person filters); only same-site paths are allowed.
function returnPath(projectId: string | null, formData?: FormData) {
  const requested = String(formData?.get("return_to") ?? "");
  if (requested.startsWith("/") && !requested.startsWith("//")) return requested;
  return projectId ? `/projects/${projectId}` : "/tasks";
}

function revalidateTaskViews(projectId: string | null) {
  revalidatePath("/");
  revalidatePath("/tasks");
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

// Creates a task. Admins can assign to anyone; developers can only assign to
// themselves — RLS enforces this too, but we validate here for a clean error
// instead of a raw database rejection.
export async function createTask(boundProjectId: string | null, formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const projectId = boundProjectId ?? (String(formData.get("project_id") ?? "") || null);
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const assignedTo = String(formData.get("assigned_to") ?? "") || profile.id;
  const priority = String(formData.get("priority") ?? "medium");
  const dueDate = String(formData.get("due_date") ?? "") || null;
  const returnTo = returnPath(boundProjectId, formData);

  if (!title) redirect(withParam(returnTo, "error", "Task title is required."));
  if (profile.role !== "admin" && assignedTo !== profile.id) {
    redirect(withParam(returnTo, "error", "You can only assign tasks to yourself."));
  }

  const validPriority = PRIORITY_OPTIONS.find((p) => p.value === priority)?.value ?? "medium";

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    project_id: projectId,
    title,
    description,
    assigned_to: assignedTo,
    priority: validPriority as Enums<"priority_level">,
    due_date: dueDate,
    created_by: profile.id,
  });

  if (error) redirect(withParam(returnTo, "error", error.message));

  revalidateTaskViews(projectId);
  redirect(withNotice(returnTo, "Task added"));
}

// Quick status change (used by the status dropdown on task lists). Returns a
// plain result instead of redirecting since it's called from a client
// component without a surrounding form navigation.
export async function updateTaskStatus(taskId: string, status: string) {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Not signed in." };

  const validStatus = TASK_STATUS_OPTIONS.find((s) => s.value === status)?.value;
  if (!validStatus) return { error: "Unknown status." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ status: validStatus as Enums<"task_status"> })
    .eq("id", taskId);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/projects/[id]", "page");
  return { error: null };
}

// Bind all three arguments (`deleteTask.bind(null, projectId, taskId, returnTo)`):
// when used as a form action the FormData arrives after them.
export async function deleteTask(projectId: string | null, taskId: string, returnTo: string | null) {
  const profile = await getCurrentProfile();
  const back =
    typeof returnTo === "string" && returnTo.startsWith("/") && !returnTo.startsWith("//")
      ? returnTo
      : returnPath(projectId);
  if (!profile || profile.role !== "admin") {
    redirect(withParam(back, "error", "Only admins can delete tasks."));
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) redirect(withParam(back, "error", error.message));

  revalidateTaskViews(projectId);
  redirect(withNotice(back, "Task deleted"));
}

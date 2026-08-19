"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from "@/lib/constants";
import type { Enums } from "@/lib/supabase/database.types";

// Creates a task. Admins can assign to anyone; developers can only assign to
// themselves — RLS enforces this too, but we validate here for a clean error
// instead of a raw database rejection.
export async function createTask(projectId: string | null, formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const assignedTo = String(formData.get("assigned_to") ?? profile!.id);
  const priority = String(formData.get("priority") ?? "medium");
  const dueDate = String(formData.get("due_date") ?? "") || null;
  const returnTo = projectId ? `/projects/${projectId}` : "/tasks";

  if (!title) {
    redirect(returnTo + "?error=" + encodeURIComponent("Task title is required."));
  }
  if (profile!.role !== "admin" && assignedTo !== profile!.id) {
    redirect(returnTo + "?error=" + encodeURIComponent("You can only assign tasks to yourself."));
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
    created_by: profile!.id,
  });

  if (error) {
    redirect(returnTo + "?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/tasks");
  revalidatePath("/tasks/team");
  if (projectId) revalidatePath(`/projects/${projectId}`);
  redirect(returnTo);
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

  revalidatePath("/tasks");
  revalidatePath("/tasks/team");
  revalidatePath("/today");
  return { error: null };
}

export async function deleteTask(projectId: string | null, taskId: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    redirect((projectId ? `/projects/${projectId}` : "/tasks") + "?error=" + encodeURIComponent("Only admins can delete tasks."));
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  const returnTo = projectId ? `/projects/${projectId}` : "/tasks";
  if (error) {
    redirect(returnTo + "?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/tasks");
  revalidatePath("/tasks/team");
  if (projectId) revalidatePath(`/projects/${projectId}`);
  redirect(returnTo);
}

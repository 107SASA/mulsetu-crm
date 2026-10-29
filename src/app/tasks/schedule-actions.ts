"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import type { Enums } from "@/lib/supabase/database.types";
import { withNotice, withParam } from "@/lib/flash";

const ITEM_TYPES: Enums<"schedule_item_type">[] = ["meeting", "call", "other"];

function safePath(value: unknown) {
  const path = typeof value === "string" ? value : "";
  return path.startsWith("/") && !path.startsWith("//") ? path : "/tasks";
}

function revalidateScheduleViews() {
  revalidatePath("/");
  revalidatePath("/tasks");
}

export async function createScheduleItem(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const returnTo = safePath(formData.get("return_to"));
  const developerId = String(formData.get("developer_id") ?? "") || profile.id;
  const date = String(formData.get("item_date") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const itemType = String(formData.get("item_type") ?? "meeting");
  const startTime = String(formData.get("start_time") ?? "");
  const endTime = String(formData.get("end_time") ?? "") || null;
  const projectId = String(formData.get("project_id") ?? "") || null;
  const notes = String(formData.get("notes") ?? "").trim();

  if (!title || !startTime || !date) {
    redirect(withParam(returnTo, "error", "Title, date, and start time are required."));
  }
  if (endTime && endTime <= startTime) {
    redirect(withParam(returnTo, "error", "The end time must be after the start time."));
  }
  if (profile.role !== "admin" && developerId !== profile.id) {
    redirect(withParam(returnTo, "error", "You can only add meetings to your own schedule."));
  }

  const validType = (ITEM_TYPES as string[]).includes(itemType) ? (itemType as Enums<"schedule_item_type">) : "meeting";

  const supabase = await createClient();
  const { error } = await supabase.from("schedule_items").insert({
    developer_id: developerId,
    title,
    item_type: validType,
    item_date: date,
    start_time: startTime,
    end_time: endTime,
    project_id: projectId,
    notes,
    created_by: profile.id,
  });
  if (error) redirect(withParam(returnTo, "error", error.message));

  revalidateScheduleViews();
  redirect(withNotice(returnTo, "Added to the schedule"));
}

export async function deleteScheduleItem(returnTo: string, itemId: string) {
  const back = safePath(returnTo);
  const supabase = await createClient();
  const { error } = await supabase.from("schedule_items").delete().eq("id", itemId);
  if (error) redirect(withParam(back, "error", error.message));

  revalidateScheduleViews();
  redirect(withNotice(back, "Removed from the schedule"));
}

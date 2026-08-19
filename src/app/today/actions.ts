"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import type { Enums } from "@/lib/supabase/database.types";

const ITEM_TYPES: Enums<"schedule_item_type">[] = ["meeting", "call", "other"];

export async function createScheduleItem(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const developerId = String(formData.get("developer_id") ?? profile!.id);
  const date = String(formData.get("item_date") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const itemType = String(formData.get("item_type") ?? "meeting");
  const startTime = String(formData.get("start_time") ?? "");
  const endTime = String(formData.get("end_time") ?? "") || null;
  const projectId = String(formData.get("project_id") ?? "") || null;
  const notes = String(formData.get("notes") ?? "").trim();

  const returnTo = `/today?date=${date}${developerId !== profile!.id ? `&developer=${developerId}` : ""}`;

  if (!title || !startTime || !date) {
    redirect(returnTo + "&error=" + encodeURIComponent("Title, date, and start time are required."));
  }
  if (profile!.role !== "admin" && developerId !== profile!.id) {
    redirect(returnTo + "&error=" + encodeURIComponent("You can only add items to your own day."));
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
    created_by: profile!.id,
  });

  if (error) {
    redirect(returnTo + "&error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/today");
  redirect(returnTo);
}

export async function deleteScheduleItem(returnTo: string, itemId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("schedule_items").delete().eq("id", itemId);

  if (error) {
    redirect(returnTo + (returnTo.includes("?") ? "&" : "?") + "error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/today");
  redirect(returnTo);
}

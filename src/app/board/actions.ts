"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { STAGE_OPTIONS } from "@/lib/constants";
import type { Enums } from "@/lib/supabase/database.types";

export async function moveProjectStage(projectId: string, newStage: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return { error: "Only admins can move projects between stages." };
  }

  const validStage = STAGE_OPTIONS.find((s) => s.value === newStage)?.value;
  if (!validStage) {
    return { error: "Unknown stage." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ stage: validStage as Enums<"project_stage"> })
    .eq("id", projectId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  return { error: null };
}

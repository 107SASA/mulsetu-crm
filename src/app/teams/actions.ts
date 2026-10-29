"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { withNotice } from "@/lib/flash";

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    redirect("/?error=" + encodeURIComponent("Only admins can manage teams."));
  }
  return profile;
}

export async function createTeam(formData: FormData) {
  const profile = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const memberIds = formData.getAll("members").map(String).filter(Boolean);

  if (!name) {
    redirect("/teams?error=" + encodeURIComponent("Team name is required."));
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teams")
    .insert({ name, created_by: profile.id })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/teams?error=" + encodeURIComponent(error?.message ?? "Could not create team."));
  }

  if (memberIds.length > 0) {
    const { error: membersError } = await supabase
      .from("team_members")
      .insert(memberIds.map((profile_id) => ({ team_id: data.id, profile_id })));
    if (membersError) {
      redirect("/teams?error=" + encodeURIComponent(membersError.message));
    }
  }

  revalidatePath("/teams");
  revalidatePath("/projects");
  redirect(withNotice("/teams", "Team created"));
}

export async function deleteTeam(teamId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("teams").delete().eq("id", teamId);
  if (error) {
    redirect("/teams?error=" + encodeURIComponent(error.message));
  }
  revalidatePath("/teams");
  revalidatePath("/projects");
  redirect(withNotice("/teams", "Team deleted"));
}

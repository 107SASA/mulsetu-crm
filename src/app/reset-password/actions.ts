"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (password.length < 8) {
    redirect("/reset-password?error=" + encodeURIComponent("Password must be at least 8 characters."));
  }
  if (password !== confirmPassword) {
    redirect("/reset-password?error=" + encodeURIComponent("Passwords don't match."));
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login/forgot-password?error=" + encodeURIComponent("Your session expired — request a new link."));
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect("/reset-password?error=" + encodeURIComponent(error.message));
  }

  redirect("/?message=" + encodeURIComponent("Password updated."));
}

"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirect("/login/forgot-password?error=" + encodeURIComponent("Enter your email address."));
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });

  // Supabase already avoids revealing whether an account exists for a given
  // email (it doesn't error on "not found") — any error surfaced here is a
  // real, safe-to-show problem like rate limiting.
  if (error) {
    redirect("/login/forgot-password?error=" + encodeURIComponent(error.message));
  }

  redirect(`/login/check-email?email=${encodeURIComponent(email)}&purpose=reset`);
}

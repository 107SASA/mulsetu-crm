"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function errorRedirect(mode: "signin" | "signup", message: string): never {
  redirect(`/login?mode=${mode}&error=${encodeURIComponent(message)}`);
}

function isEmailRateLimit(error: { message: string; code?: string }) {
  return (
    error.code === "over_email_send_rate_limit" ||
    /only request this after \d+ seconds/i.test(error.message)
  );
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    errorRedirect("signin", "Email and password are required.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    errorRedirect("signin", error.message);
  }

  redirect("/");
}

export async function signUp(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !email || !password) {
    errorRedirect("signup", "Name, email, and password are all required.");
  }
  if (password.length < 8) {
    errorRedirect("signup", "Password must be at least 8 characters.");
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: origin ? `${origin}/auth/confirm` : undefined,
    },
  });

  // A retry (or double-click) after a successful signup tries to resend the
  // confirmation email and hits Supabase's send limit. The account already
  // exists — send them to check-email instead of the raw rate-limit error.
  if (error && isEmailRateLimit(error)) {
    redirect(`/login/check-email?email=${encodeURIComponent(email)}`);
  }

  if (error) {
    errorRedirect("signup", error.message);
  }

  // Existing confirmed accounts come back as a user with no identities so
  // callers can't enumerate emails. Point them at sign-in instead.
  if (data.user && data.user.identities?.length === 0) {
    errorRedirect("signin", "An account with this email already exists. Sign in instead.");
  }

  // If email confirmation is required, signUp() succeeds but returns no
  // session — the account exists but can't sign in until the link is
  // clicked. Send them to a "check your email" notice instead of pretending
  // they're logged in (the proxy would just bounce them back to /login).
  if (!data.session) {
    redirect(`/login/check-email?email=${encodeURIComponent(email)}`);
  }

  redirect("/");
}

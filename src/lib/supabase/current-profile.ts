import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type Profile = Tables<"profiles">;

// Fetches the signed-in user's profile row (id, name, email, role).
// Returns null if no one is signed in.
//
// Wrapped in React `cache` so the layout, the page, and any server action in
// the same request share one lookup instead of each hitting Supabase again.
// `getClaims` verifies the JWT locally (when the project uses asymmetric
// signing keys) rather than making a network round-trip to Supabase Auth.
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();

  return profile;
});

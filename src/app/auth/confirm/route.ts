import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles the links Supabase sends in confirmation/recovery emails:
//   /auth/confirm?token_hash=...&type=recovery&next=/reset-password
// Verifies the token server-side (establishing a session via cookies), then
// redirects to `next` — or back to login with an error if the link is bad
// (expired, already used, etc).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  const errorUrl = new URL("/login", request.url);
  errorUrl.searchParams.set("error", "That link is invalid or has expired. Please try again.");
  return NextResponse.redirect(errorUrl);
}

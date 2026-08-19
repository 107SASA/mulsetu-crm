import Link from "next/link";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { updatePassword } from "./actions";
import { Button } from "@/components/ui/button";
import { CARD } from "@/lib/card-styles";
import { FIELD, FIELD_LABEL } from "@/lib/field-styles";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const profile = await getCurrentProfile();

  return (
    <div className="flex flex-1 items-center justify-center bg-linear-to-b from-accent-50/60 to-transparent px-4 py-12 dark:from-accent-100/5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-accent-600 text-lg font-bold text-white shadow-sm">
            M
          </span>
          <h1 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Set a new password</h1>
          {profile && (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">for {profile.email}</p>
          )}
        </div>

        <div className={`${CARD} p-6`}>
          {error && (
            <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          {!profile ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              That link is invalid or has expired.{" "}
              <Link href="/login/forgot-password" className="font-medium text-accent-600 hover:underline dark:text-accent-500">
                Request a new one
              </Link>
              .
            </p>
          ) : (
            <form action={updatePassword} className="space-y-4">
              <div>
                <label htmlFor="password" className={FIELD_LABEL}>
                  New password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className={`mt-1 ${FIELD}`}
                />
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">At least 8 characters.</p>
              </div>
              <div>
                <label htmlFor="confirm_password" className={FIELD_LABEL}>
                  Confirm new password
                </label>
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className={`mt-1 ${FIELD}`}
                />
              </div>
              <Button type="submit" variant="primary" className="w-full">
                Update password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

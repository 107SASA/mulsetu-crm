import Link from "next/link";
import { requestPasswordReset } from "./actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { CARD } from "@/lib/card-styles";
import { FIELD, FIELD_LABEL } from "@/lib/field-styles";
import { BrandLogo } from "@/components/brand-logo";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-linear-to-b from-accent-50/60 to-transparent px-4 py-12 dark:from-accent-100/5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <BrandLogo size="lg" className="mx-auto" />
          <h1 className="mt-3 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Reset your password</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <div className={`${CARD} p-6`}>
          {error && (
            <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          <form action={requestPasswordReset} className="space-y-4">
            <div>
              <label htmlFor="email" className={FIELD_LABEL}>
                Email
              </label>
              <input id="email" name="email" type="email" autoComplete="email" required className={`mt-1 ${FIELD}`} />
            </div>
            <SubmitButton pendingLabel="Sending…">Send reset link</SubmitButton>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          <Link href="/login" className="font-medium text-accent-600 hover:underline dark:text-accent-500">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

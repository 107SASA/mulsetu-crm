import Link from "next/link";
import { signIn, signUp } from "./actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { PasswordField } from "@/components/ui/password-field";
import { CARD } from "@/lib/card-styles";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; error?: string }>;
}) {
  const params = await searchParams;
  const mode = params.mode === "signup" ? "signup" : "signin";
  const error = params.error;

  return (
    <div className="flex flex-1 items-center justify-center bg-linear-to-b from-accent-50/60 to-transparent px-4 py-12 dark:from-accent-100/5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-accent-600 text-lg font-bold text-white shadow-sm">
            M
          </span>
          <h1 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Mulsetu CRM</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {mode === "signin" ? "Sign in to your account" : "Create your account"}
          </p>
        </div>

        <div className={`${CARD} p-6`}>
          {error && (
            <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          {mode === "signin" ? (
            <form action={signIn} className="space-y-4">
              <Field label="Email" name="email" type="email" autoComplete="email" required />
              <PasswordField
                autoComplete="current-password"
                required
                headerRight={
                  <Link href="/login/forgot-password" className="text-xs font-medium text-accent-600 hover:underline dark:text-accent-500">
                    Forgot password?
                  </Link>
                }
              />
              <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
            </form>
          ) : (
            <form action={signUp} className="space-y-4">
              <Field label="Full name" name="full_name" type="text" autoComplete="name" required />
              <Field label="Email" name="email" type="email" autoComplete="email" required />
              <PasswordField autoComplete="new-password" required helperText="At least 8 characters." />
              <SubmitButton pendingLabel="Creating account…">Create account</SubmitButton>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          {mode === "signin" ? (
            <>
              New here?{" "}
              <Link href="/login?mode=signup" className="font-medium text-accent-600 hover:underline dark:text-accent-500">
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/login?mode=signin" className="font-medium text-accent-600 hover:underline dark:text-accent-500">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type,
  autoComplete,
  required,
  helperText,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete?: string;
  required?: boolean;
  helperText?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-base text-zinc-900 shadow-sm transition-shadow focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      />
      {helperText && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{helperText}</p>}
    </div>
  );
}

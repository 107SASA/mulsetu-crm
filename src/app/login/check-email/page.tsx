import { CARD } from "@/lib/card-styles";

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; purpose?: string }>;
}) {
  const { email, purpose } = await searchParams;
  const isReset = purpose === "reset";

  return (
    <div className="flex flex-1 items-center justify-center bg-linear-to-b from-accent-50/60 to-transparent px-4 py-12 dark:from-accent-100/5">
      <div className={`${CARD} w-full max-w-sm p-6 text-center`}>
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-accent-100 text-lg dark:bg-accent-100/10">
          ✉️
        </span>
        <h1 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Check your email</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {isReset ? (
            <>
              If an account exists for{" "}
              {email ? <span className="font-medium text-zinc-700 dark:text-zinc-300">{email}</span> : "that address"},
              we sent a password reset link. Click it to choose a new password.
            </>
          ) : (
            <>
              We sent a confirmation link to{" "}
              {email ? <span className="font-medium text-zinc-700 dark:text-zinc-300">{email}</span> : "your email"}.
              Click it to activate your account, then come back and sign in.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export function PageHeading({
  kicker,
  title,
  description,
  actions,
}: {
  kicker?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="min-w-0">
        {kicker && (
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">{kicker}</p>
        )}
        <h1 className={`${kicker ? "mt-1" : ""} text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-50`}>
          {title}
        </h1>
        {description && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>}
      </div>
      {actions && <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto">{actions}</div>}
    </div>
  );
}

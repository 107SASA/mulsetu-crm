import { CARD } from "@/lib/card-styles";

// Loading placeholders shown by the route-level loading.tsx files while a
// page's data is fetched on the server. They mirror the real page layouts so
// content doesn't jump when it arrives.

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-800 ${className}`} />;
}

function PageShell({ width = "max-w-6xl", children }: { width?: string; children: React.ReactNode }) {
  return (
    <div
      className={`mx-auto w-full min-w-0 px-4 py-5 sm:px-6 sm:py-8 ${width}`}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      {children}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

function HeadingSkeleton({ withAction = true }: { withAction?: boolean }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      {withAction && <Skeleton className="h-9 w-full sm:w-32" />}
    </div>
  );
}

export function ListPageSkeleton({ width, rows = 6 }: { width?: string; rows?: number }) {
  return (
    <PageShell width={width}>
      <HeadingSkeleton />
      <div className="mt-5 flex flex-wrap gap-3">
        <Skeleton className="h-9 w-full sm:w-36" />
        <Skeleton className="h-9 w-full sm:w-32" />
        <Skeleton className="h-9 w-full sm:w-32" />
      </div>
      <div className="mt-6 space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className={`${CARD} flex items-center justify-between gap-4 p-4`}>
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </PageShell>
  );
}

export function DashboardSkeleton() {
  return (
    <PageShell>
      <HeadingSkeleton />
      {[0, 1].map((row) => (
        <div key={row} className="mt-8 grid gap-6 lg:grid-cols-2">
          {[0, 1].map((col) => (
            <div key={col} className="space-y-2">
              <Skeleton className="mb-3 h-4 w-32" />
              {[0, 1, 2].map((i) => (
                <div key={i} className={`${CARD} space-y-2 p-3`}>
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </PageShell>
  );
}

export function DetailPageSkeleton() {
  return (
    <PageShell>
      <Skeleton className="h-4 w-24" />
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-full sm:w-32" />
      </div>
      <div className={`${CARD} mt-5 p-5`}>
        <Skeleton className="h-3 w-16" />
        <div className="mt-3 flex gap-1">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-1.5 flex-1 rounded-full" />
          ))}
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {[3, 4].map((rows, card) => (
            <div key={card} className={`${CARD} space-y-3 p-5`}>
              <Skeleton className="h-4 w-24" />
              {Array.from({ length: rows }, (_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ))}
        </div>
        <div className="space-y-6">
          {[4, 3].map((rows, card) => (
            <div key={card} className={`${CARD} space-y-3 p-5`}>
              <Skeleton className="h-4 w-20" />
              {Array.from({ length: rows }, (_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

export function FormPageSkeleton() {
  return (
    <PageShell width="max-w-2xl">
      <HeadingSkeleton withAction={false} />
      <div className={`${CARD} mt-6 space-y-5 p-5`}>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <Skeleton className="h-10 w-full sm:w-36" />
      </div>
    </PageShell>
  );
}

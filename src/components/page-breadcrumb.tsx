"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { crumbsForPath } from "@/lib/nav";

export function PageBreadcrumb() {
  const pathname = usePathname();
  const crumbs = crumbsForPath(pathname);
  const current = crumbs[crumbs.length - 1];

  return (
    <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium text-zinc-900 sm:hidden dark:text-zinc-50">{current?.label}</p>
      <ol className="hidden items-center gap-1.5 overflow-hidden text-sm sm:flex">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex min-w-0 items-center gap-1.5">
              {index > 0 && <span className="text-zinc-300 dark:text-zinc-600">/</span>}
              {last ? (
                <span className="truncate font-medium text-zinc-900 dark:text-zinc-50">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="truncate text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

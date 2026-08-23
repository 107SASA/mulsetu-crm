"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavItemActive, type NavGroup } from "@/lib/nav";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { ProfileMenu } from "@/components/profile-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLogo } from "@/components/brand-logo";

export function AppFrame({
  groups,
  fullName,
  email,
  role,
  children,
}: {
  groups: NavGroup[];
  fullName: string;
  email: string;
  role: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="flex min-h-dvh">
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-zinc-900/20 backdrop-blur-[2px] lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[min(18.5rem,88vw)] flex-col border-r border-zinc-200 bg-white pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-zinc-700 transition-transform duration-200 lg:static lg:w-60 lg:translate-x-0 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 ${
          open ? "translate-x-0 shadow-xl" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-2 px-3 py-3 lg:px-4">
          <Link href="/" className="min-w-0" aria-label="Mulsetu CRM home">
            <BrandLogo size="md" className="rounded-lg" />
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 lg:hidden dark:hover:bg-zinc-800"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden>
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="px-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = isNavItemActive(item.href, pathname);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex min-h-11 items-center rounded-xl px-3 text-[15px] transition-colors lg:min-h-9 lg:text-sm ${
                        active
                          ? "bg-accent-50 font-medium text-accent-700 dark:bg-white/10 dark:text-white"
                          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-100"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex min-h-14 items-center gap-2 border-b border-zinc-200 bg-white/90 px-3 pt-[env(safe-area-inset-top)] backdrop-blur-md sm:gap-3 sm:px-4 dark:border-zinc-800 dark:bg-zinc-950/80">
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 lg:hidden dark:text-zinc-300 dark:hover:bg-zinc-800"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden>
              <path
                fillRule="evenodd"
                d="M3 5.25A.75.75 0 0 1 3.75 4.5h12.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 5.25Zm0 4.75a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 10Zm0 4.75a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <PageBreadcrumb />
          <ThemeToggle />
          <ProfileMenu fullName={fullName} email={email} role={role} />
        </header>
        <main className="flex flex-1 flex-col pb-[env(safe-area-inset-bottom)]">{children}</main>
      </div>
    </div>
  );
}

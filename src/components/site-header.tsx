import Link from "next/link";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { signOut } from "@/app/actions/auth";
import { NavLinks } from "@/components/nav-links";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";

function navLinks(isAdmin: boolean) {
  return [
    { href: "/", label: "Dashboard" },
    { href: "/today", label: "Today" },
    { href: "/tasks", label: "My Tasks" },
    { href: "/board", label: "Board" },
    { href: "/deadlines", label: "Deadlines" },
    { href: "/clients", label: "Clients" },
    { href: "/projects", label: "Projects" },
    ...(isAdmin ? [{ href: "/tasks/team", label: "Team Tasks" }] : []),
  ];
}

export async function SiteHeader() {
  const profile = await getCurrentProfile();
  const links = navLinks(profile?.role === "admin");

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/90">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-600 text-sm font-bold text-white">
            M
          </span>
          <span className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Mulsetu CRM</span>
        </Link>

        {profile && (
          <>
            <NavLinks links={links} />

            <div className="flex items-center gap-3 text-sm">
              <div className="hidden items-center gap-2 sm:flex">
                <Avatar name={profile.full_name || profile.email} size="sm" />
                <span className="text-zinc-500 dark:text-zinc-400">
                  {profile.full_name || profile.email}
                  <span className="ml-1.5 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {profile.role}
                  </span>
                </span>
              </div>
              <ButtonLink href="/reset-password" variant="ghost" size="sm" title="Change password" aria-label="Change password">
                <span aria-hidden>🔑</span>
                <span className="hidden sm:inline">Change password</span>
              </ButtonLink>
              <form action={signOut}>
                <Button type="submit" variant="secondary" size="sm">
                  Sign out
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

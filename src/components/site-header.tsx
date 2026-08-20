import Link from "next/link";
import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { NavLinks } from "@/components/nav-links";
import { ProfileMenu } from "@/components/profile-menu";

function navLinks(isAdmin: boolean) {
  return [
    { href: "/", label: "Dashboard" },
    { href: "/today", label: "Today" },
    { href: "/tasks", label: "My Tasks" },
    { href: "/board", label: "Board" },
    { href: "/deadlines", label: "Deadlines" },
    { href: "/clients", label: "Clients" },
    { href: "/projects", label: "Projects" },
    ...(isAdmin
      ? [
          { href: "/tasks/team", label: "Team Tasks" },
          { href: "/teams", label: "Teams" },
        ]
      : []),
  ];
}

export async function SiteHeader() {
  const profile = await getCurrentProfile();
  const links = navLinks(profile?.role === "admin");

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/90">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-600 text-sm font-bold text-white">
            M
          </span>
          <span className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Mulsetu CRM</span>
        </Link>

        {profile && (
          <>
            <NavLinks links={links} />
            <ProfileMenu fullName={profile.full_name} email={profile.email} role={profile.role} />
          </>
        )}
      </div>
    </header>
  );
}

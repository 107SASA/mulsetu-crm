import { getCurrentProfile } from "@/lib/supabase/current-profile";
import { getNavGroups } from "@/lib/nav";
import { AppFrame } from "@/components/app-frame";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) {
    return <div className="flex min-h-full flex-col">{children}</div>;
  }

  return (
    <AppFrame
      groups={getNavGroups(profile.role === "admin")}
      fullName={profile.full_name}
      email={profile.email}
      role={profile.role}
    >
      {children}
    </AppFrame>
  );
}

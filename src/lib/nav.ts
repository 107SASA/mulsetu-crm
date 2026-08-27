export type NavItem = { href: string; label: string };

export function getNavItems(): NavItem[] {
  return [
    { href: "/", label: "Dashboard" },
    { href: "/projects", label: "Projects" },
    { href: "/tasks", label: "Tasks" },
    { href: "/today", label: "Today" },
    { href: "/clients", label: "Clients" },
    { href: "/teams", label: "Team" },
  ];
}

const SEGMENT_LABELS: Record<string, string> = {
  today: "Today",
  tasks: "Tasks",
  team: "Team",
  board: "Pipeline",
  deadlines: "Deadlines",
  clients: "Clients",
  projects: "Projects",
  teams: "Team",
  new: "New",
  "reset-password": "Password",
  login: "Sign in",
  "forgot-password": "Reset",
  "check-email": "Check email",
};

function looksLikeId(segment: string) {
  return /^[0-9a-f]{8}-[0-9a-f-]{4,}$/i.test(segment) || segment.length > 22;
}

export function crumbsForPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return [{ href: "/", label: "Dashboard" }];

  const crumbs = [{ href: "/", label: "Dashboard" }];
  let href = "";
  for (const part of parts) {
    href += `/${part}`;
    crumbs.push({
      href,
      label: SEGMENT_LABELS[part] ?? (looksLikeId(part) ? "Details" : part),
    });
  }
  return crumbs;
}

export function isNavItemActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  if (href === "/tasks") {
    return pathname === "/tasks" || pathname.startsWith("/tasks/");
  }
  if (href === "/teams") {
    return pathname === "/teams" || pathname.startsWith("/teams/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

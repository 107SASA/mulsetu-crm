export type NavItem = { href: string; label: string };
export type NavGroup = { title: string; items: NavItem[] };

export function getNavGroups(isAdmin: boolean): NavGroup[] {
  return [
    { title: "Overview", items: [{ href: "/", label: "Dashboard" }] },
    {
      title: "Work",
      items: [
        { href: "/today", label: "Today" },
        { href: "/tasks", label: "My tasks" },
        { href: "/board", label: "Pipeline" },
        { href: "/deadlines", label: "Deadlines" },
      ],
    },
    {
      title: "Records",
      items: [
        { href: "/clients", label: "Clients" },
        { href: "/projects", label: "Projects" },
      ],
    },
    ...(isAdmin
      ? [
          {
            title: "Team",
            items: [
              { href: "/tasks/team", label: "Team tasks" },
              { href: "/teams", label: "Teams" },
            ],
          },
        ]
      : []),
  ];
}

const SEGMENT_LABELS: Record<string, string> = {
  today: "Today",
  tasks: "My tasks",
  team: "Team tasks",
  board: "Pipeline",
  deadlines: "Deadlines",
  clients: "Clients",
  projects: "Projects",
  teams: "Teams",
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
    return pathname === "/tasks" || (pathname.startsWith("/tasks/") && !pathname.startsWith("/tasks/team"));
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

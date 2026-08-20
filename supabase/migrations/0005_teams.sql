-- Teams of developers that can be assigned to a project as a group.

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.team_members (
  team_id uuid not null references public.teams (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  primary key (team_id, profile_id)
);

create index team_members_profile_id_idx on public.team_members (profile_id);

alter table public.projects
  add column assigned_team_id uuid references public.teams (id) on delete set null;

create index projects_assigned_team_id_idx on public.projects (assigned_team_id);

alter table public.teams enable row level security;
alter table public.team_members enable row level security;

create policy teams_select_all on public.teams
  for select to authenticated using (true);

create policy teams_write_admin on public.teams
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy team_members_select_all on public.team_members
  for select to authenticated using (true);

create policy team_members_write_admin on public.team_members
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

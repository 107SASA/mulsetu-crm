-- Mulsetu CRM — initial schema
-- Tables: profiles, clients, projects, project_links, tasks, schedule_items
-- Roles: admin (full access), developer (own tasks/schedule, read-only elsewhere)

-- ==========================================================================
-- ENUMS
-- ==========================================================================
create type user_role as enum ('admin', 'developer');

create type project_stage as enum (
  'incoming',
  'requirements',
  'in_progress',
  'review_testing',
  'client_review',
  'completed',
  'on_hold_cancelled'
);

create type priority_level as enum ('low', 'medium', 'high', 'urgent');

create type task_status as enum ('todo', 'in_progress', 'done', 'blocked');

create type schedule_item_type as enum ('meeting', 'call', 'other');

-- ==========================================================================
-- HELPER FUNCTIONS (part 1 — no table dependencies)
-- ==========================================================================

-- Generic "touch updated_at" trigger function, reused by several tables.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ==========================================================================
-- PROFILES  (1:1 with auth.users)
-- ==========================================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null,
  role user_role not null default 'developer',
  created_at timestamptz not null default now()
);

-- Returns true if the current authenticated user is an admin.
-- security definer so it can read `profiles` without recursing through RLS.
-- (Must be created after `profiles` exists — `language sql` function bodies
-- are validated against the schema at CREATE FUNCTION time.)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Auto-create a profile row whenever a new auth user signs up.
-- The first user ever created becomes admin; everyone after is a developer
-- by default (an admin can promote them later).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    (case when (select count(*) from public.profiles) = 0 then 'admin' else 'developer' end)::user_role
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Prevent a non-admin from escalating their own privileges via a profile update.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role <> old.role and not public.is_admin() then
    new.role = old.role;
  end if;
  return new;
end;
$$;

create trigger protect_profile_role_trigger
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ==========================================================================
-- CLIENTS
-- ==========================================================================
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null default '',
  contact_email text not null default '',
  contact_phone text not null default '',
  notes text not null default '',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- ==========================================================================
-- PROJECTS
-- ==========================================================================
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null,
  description text not null default '',
  stage project_stage not null default 'incoming',
  priority priority_level not null default 'medium',
  start_date date,
  deadline date,
  budget numeric(12, 2),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_client_id_idx on public.projects (client_id);
create index projects_stage_idx on public.projects (stage);
create index projects_deadline_idx on public.projects (deadline);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ==========================================================================
-- PROJECT LINKS  (Drive folders, Figma, repo, etc. — links only for v1)
-- ==========================================================================
create table public.project_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  label text not null,
  url text not null,
  created_at timestamptz not null default now()
);

create index project_links_project_id_idx on public.project_links (project_id);

-- ==========================================================================
-- TASKS
-- ==========================================================================
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects (id) on delete cascade,
  title text not null,
  description text not null default '',
  assigned_to uuid references public.profiles (id) on delete set null,
  status task_status not null default 'todo',
  priority priority_level not null default 'medium',
  due_date date,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_project_id_idx on public.tasks (project_id);
create index tasks_assigned_to_idx on public.tasks (assigned_to);
create index tasks_status_idx on public.tasks (status);
create index tasks_due_date_idx on public.tasks (due_date);

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ==========================================================================
-- SCHEDULE ITEMS  (meetings/calls/standups on a developer's day planner)
-- ==========================================================================
create table public.schedule_items (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  item_type schedule_item_type not null default 'meeting',
  project_id uuid references public.projects (id) on delete set null,
  item_date date not null,
  start_time time not null,
  end_time time,
  notes text not null default '',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index schedule_items_developer_date_idx on public.schedule_items (developer_id, item_date);

-- ==========================================================================
-- ROW LEVEL SECURITY
-- ==========================================================================
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.project_links enable row level security;
alter table public.tasks enable row level security;
alter table public.schedule_items enable row level security;

-- PROFILES: everyone (authenticated) can read all profiles (needed to show
-- names on tasks/schedule/assignment pickers). Users can update their own
-- row (role changes are blocked by the trigger above unless they're admin).
-- Only admins can update any profile or delete one.
create policy profiles_select_all on public.profiles
  for select to authenticated using (true);

create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy profiles_update_admin on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy profiles_delete_admin on public.profiles
  for delete to authenticated using (public.is_admin());

-- CLIENTS: everyone can read; only admins can write.
create policy clients_select_all on public.clients
  for select to authenticated using (true);

create policy clients_write_admin on public.clients
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- PROJECTS: everyone can read; only admins can write.
create policy projects_select_all on public.projects
  for select to authenticated using (true);

create policy projects_write_admin on public.projects
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- PROJECT LINKS: everyone can read; only admins can write.
create policy project_links_select_all on public.project_links
  for select to authenticated using (true);

create policy project_links_write_admin on public.project_links
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- TASKS: everyone can read (team-wide visibility). Admins have full control;
-- developers can create/update tasks assigned to themselves.
create policy tasks_select_all on public.tasks
  for select to authenticated using (true);

create policy tasks_insert on public.tasks
  for insert to authenticated with check (public.is_admin() or assigned_to = auth.uid());

create policy tasks_update on public.tasks
  for update to authenticated
  using (public.is_admin() or assigned_to = auth.uid())
  with check (public.is_admin() or assigned_to = auth.uid());

create policy tasks_delete_admin on public.tasks
  for delete to authenticated using (public.is_admin());

-- SCHEDULE ITEMS: a developer sees/manages their own day; admins see/manage everyone's.
create policy schedule_select on public.schedule_items
  for select to authenticated using (public.is_admin() or developer_id = auth.uid());

create policy schedule_insert on public.schedule_items
  for insert to authenticated with check (public.is_admin() or developer_id = auth.uid());

create policy schedule_update on public.schedule_items
  for update to authenticated
  using (public.is_admin() or developer_id = auth.uid())
  with check (public.is_admin() or developer_id = auth.uid());

create policy schedule_delete on public.schedule_items
  for delete to authenticated using (public.is_admin() or developer_id = auth.uid());

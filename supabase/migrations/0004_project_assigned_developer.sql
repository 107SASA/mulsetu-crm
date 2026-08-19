-- Lets an admin assign a project to a specific developer (its primary owner),
-- separate from individual task assignments.
alter table public.projects
  add column assigned_to uuid references public.profiles (id) on delete set null;

create index projects_assigned_to_idx on public.projects (assigned_to);

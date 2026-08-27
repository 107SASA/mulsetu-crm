-- Project type: Client Project vs Internal Product.
-- Internal products do not require a client. Existing client projects stay as-is.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'project_type') then
    create type project_type as enum ('client', 'internal');
  end if;
end $$;

alter table public.projects
  add column if not exists project_type project_type not null default 'client';

alter table public.projects
  alter column client_id drop not null;

alter table public.projects
  drop constraint if exists projects_client_matches_type;

alter table public.projects
  add constraint projects_client_matches_type check (
    (project_type = 'client' and client_id is not null)
    or (project_type = 'internal')
  );

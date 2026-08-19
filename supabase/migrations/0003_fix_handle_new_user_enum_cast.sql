-- Bug found via smoke test: the CASE expression in handle_new_user() resolves
-- to `text`, and Postgres won't implicitly cast a concrete `text` value into
-- the `user_role` enum (only untyped string literals get that cast), so every
-- signup failed with "column "role" is of type user_role but expression is
-- of type text". Fixed by casting the CASE result explicitly.
--
-- (0001_init.sql has also been corrected in place so a fresh install never
-- hits this bug; this migration documents the fix actually applied live.)

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

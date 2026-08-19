-- Security hardening per Supabase advisor output:
--  1. Lock down search_path on set_updated_at (was mutable).
--  2. Trigger-only functions (handle_new_user, protect_profile_role) should
--     never be callable directly via the PostgREST API — revoke EXECUTE from
--     anon/authenticated/public. Triggers still fire fine: trigger invocation
--     runs under the function's own privileges, not the querying role's.
--  3. is_admin() IS called from RLS policies evaluated as `authenticated`, so
--     it must stay executable by that role — but anon never needs it.

alter function public.set_updated_at() set search_path = public;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_profile_role() from public, anon, authenticated;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

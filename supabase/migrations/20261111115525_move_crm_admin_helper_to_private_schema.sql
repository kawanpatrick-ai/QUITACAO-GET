-- Keep the RLS helper outside the exposed public API schema.
create schema if not exists private authorization postgres;
revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;
grant usage on schema private to authenticated;

create or replace function private.crm_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.crm_memberships m
    where m.user_id = (select auth.uid())
      and m.enabled is true
      and m.role = 'admin'
  );
$function$;

revoke all on function private.crm_is_admin() from public;
revoke all on function private.crm_is_admin() from anon;
revoke all on function private.crm_is_admin() from authenticated;
grant execute on function private.crm_is_admin() to authenticated;

drop policy if exists crm_membership_select on public.crm_memberships;
create policy crm_membership_select
on public.crm_memberships
for select
to authenticated
using (
  user_id = (select auth.uid())
  or private.crm_is_admin()
);

drop policy if exists crm_membership_insert_admin on public.crm_memberships;
create policy crm_membership_insert_admin
on public.crm_memberships
for insert
to authenticated
with check (private.crm_is_admin());

drop policy if exists crm_membership_update_admin on public.crm_memberships;
create policy crm_membership_update_admin
on public.crm_memberships
for update
to authenticated
using (private.crm_is_admin())
with check (private.crm_is_admin());

drop policy if exists crm_membership_delete_admin on public.crm_memberships;
create policy crm_membership_delete_admin
on public.crm_memberships
for delete
to authenticated
using (private.crm_is_admin());

drop function if exists public.crm_is_admin();

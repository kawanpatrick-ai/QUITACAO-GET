-- Bootstrap first administrator and enable membership-based administration.
create or replace function public.crm_is_admin()
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

revoke all on function public.crm_is_admin() from public;
grant execute on function public.crm_is_admin() to authenticated;

drop policy if exists crm_membership_select on public.crm_memberships;
create policy crm_membership_select
on public.crm_memberships
for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.crm_is_admin()
);

drop policy if exists crm_membership_insert_admin on public.crm_memberships;
create policy crm_membership_insert_admin
on public.crm_memberships
for insert
to authenticated
with check (public.crm_is_admin());

drop policy if exists crm_membership_update_admin on public.crm_memberships;
create policy crm_membership_update_admin
on public.crm_memberships
for update
to authenticated
using (public.crm_is_admin())
with check (public.crm_is_admin());

drop policy if exists crm_membership_delete_admin on public.crm_memberships;
create policy crm_membership_delete_admin
on public.crm_memberships
for delete
to authenticated
using (public.crm_is_admin());

insert into public.crm_memberships (user_id, role, enabled)
select u.id, 'admin', true
from auth.users u
where lower(u.email) = lower('patrickkawan719@gmail.com')
on conflict (user_id) do update
set role = excluded.role,
    enabled = excluded.enabled;

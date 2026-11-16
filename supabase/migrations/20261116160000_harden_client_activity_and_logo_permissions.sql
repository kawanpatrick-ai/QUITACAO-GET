-- Restrict direct table writes while keeping the CRM's authorized workflows.
begin;

-- Clients are edited in the CRM, but creation/import must pass through the
-- membership-checked RPCs. Remove DELETE/TRUNCATE and direct INSERT from operators.
revoke all privileges on table public.crm_clients from authenticated;
grant select, update on table public.crm_clients to authenticated;

-- The audit trail is append-only for authenticated users.
revoke all privileges on table public.crm_activities from authenticated;
grant select, insert on table public.crm_activities to authenticated;

-- Institutions remain editable through the UI, but cannot be deleted by operators.
revoke all privileges on table public.crm_parties from authenticated;
grant select, insert, update on table public.crm_parties to authenticated;

drop policy if exists crm_clients_access on public.crm_clients;
drop policy if exists crm_clients_select_active on public.crm_clients;
drop policy if exists crm_clients_update_active on public.crm_clients;
create policy crm_clients_select_active
on public.crm_clients
for select
to authenticated
using (
  exists (
    select 1 from public.crm_memberships m
    where m.user_id = (select auth.uid()) and m.enabled
  )
);
create policy crm_clients_update_active
on public.crm_clients
for update
to authenticated
using (
  exists (
    select 1 from public.crm_memberships m
    where m.user_id = (select auth.uid()) and m.enabled
  )
)
with check (
  exists (
    select 1 from public.crm_memberships m
    where m.user_id = (select auth.uid()) and m.enabled
  )
);

drop policy if exists crm_activities_access on public.crm_activities;
drop policy if exists crm_activities_select_active on public.crm_activities;
drop policy if exists crm_activities_insert_own on public.crm_activities;
create policy crm_activities_select_active
on public.crm_activities
for select
to authenticated
using (
  exists (
    select 1 from public.crm_memberships m
    where m.user_id = (select auth.uid()) and m.enabled
  )
);
create policy crm_activities_insert_own
on public.crm_activities
for insert
to authenticated
with check (
  actor_id = (select auth.uid())
  and exists (
    select 1 from public.crm_memberships m
    where m.user_id = (select auth.uid()) and m.enabled
  )
);

drop policy if exists crm_parties_access on public.crm_parties;
drop policy if exists crm_parties_select_active on public.crm_parties;
drop policy if exists crm_parties_insert_active on public.crm_parties;
drop policy if exists crm_parties_update_active on public.crm_parties;
create policy crm_parties_select_active
on public.crm_parties
for select
to authenticated
using (
  exists (
    select 1 from public.crm_memberships m
    where m.user_id = (select auth.uid()) and m.enabled
  )
);
create policy crm_parties_insert_active
on public.crm_parties
for insert
to authenticated
with check (
  exists (
    select 1 from public.crm_memberships m
    where m.user_id = (select auth.uid()) and m.enabled
  )
);
create policy crm_parties_update_active
on public.crm_parties
for update
to authenticated
using (
  exists (
    select 1 from public.crm_memberships m
    where m.user_id = (select auth.uid()) and m.enabled
  )
)
with check (
  exists (
    select 1 from public.crm_memberships m
    where m.user_id = (select auth.uid()) and m.enabled
  )
);

-- SECURITY DEFINER preserves the client-creation/import paths after direct
-- INSERT is revoked. Both functions retain their auth.uid()/membership
-- checks and a fixed search_path (crm_import_excel is admin-only).
alter function public.crm_create_client(text, text, text) security definer;
alter function public.crm_create_client(text, text, text) set search_path to 'public', 'pg_temp';
revoke all on function public.crm_create_client(text, text, text) from public, anon;
grant execute on function public.crm_create_client(text, text, text) to authenticated, service_role;

alter function public.crm_import_excel(jsonb) security definer;
alter function public.crm_import_excel(jsonb) set search_path to 'public', 'pg_temp';
revoke all on function public.crm_import_excel(jsonb) from public, anon;
grant execute on function public.crm_import_excel(jsonb) to authenticated, service_role;

-- Remove the legacy email bypass from logo storage. The remaining admin
-- insert/delete policies are membership-backed.
drop policy if exists crm_institution_logos_select on storage.objects;
drop policy if exists crm_institution_logos_insert on storage.objects;
drop policy if exists crm_institution_logos_delete on storage.objects;
create policy crm_institution_logos_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'crm-institution-logos'
  and exists (
    select 1 from public.crm_memberships m
    where m.user_id = (select auth.uid()) and m.enabled
  )
);

commit;

-- Remove the legacy hard-coded email bypass. Every CRM session must have an active membership.
drop policy if exists crm_activities_access on public.crm_activities;
create policy crm_activities_access
on public.crm_activities
for all
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

drop policy if exists crm_clients_access on public.crm_clients;
create policy crm_clients_access
on public.crm_clients
for all
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

drop policy if exists crm_completed_insert_own on public.crm_completed_activities;
create policy crm_completed_insert_own
on public.crm_completed_activities
for insert
to authenticated
with check (
  actor_id = (select auth.uid())
  and performed_on <= ((now() at time zone 'America/Sao_Paulo')::date)
  and exists (
    select 1 from public.crm_memberships m
    where m.user_id = (select auth.uid()) and m.enabled
  )
);

drop policy if exists crm_completed_select_combined on public.crm_completed_activities;
create policy crm_completed_select_combined
on public.crm_completed_activities
for select
to authenticated
using (
  (
    actor_id = (select auth.uid())
    and exists (
      select 1 from public.crm_memberships m
      where m.user_id = (select auth.uid()) and m.enabled
    )
  )
  or exists (
    select 1 from public.crm_memberships m
    where m.user_id = (select auth.uid()) and m.enabled and m.role = 'admin'
  )
);

drop policy if exists crm_completed_update_combined on public.crm_completed_activities;
create policy crm_completed_update_combined
on public.crm_completed_activities
for update
to authenticated
using (
  deleted_at is null
  and (
    (
      actor_id = (select auth.uid())
      and exists (
        select 1 from public.crm_memberships m
        where m.user_id = (select auth.uid()) and m.enabled
      )
    )
    or exists (
      select 1 from public.crm_memberships m
      where m.user_id = (select auth.uid()) and m.enabled and m.role = 'admin'
    )
  )
)
with check (
  performed_on <= ((now() at time zone 'America/Sao_Paulo')::date)
  and (
    (
      actor_id = (select auth.uid())
      and exists (
        select 1 from public.crm_memberships m
        where m.user_id = (select auth.uid()) and m.enabled
      )
    )
    or exists (
      select 1 from public.crm_memberships m
      where m.user_id = (select auth.uid()) and m.enabled and m.role = 'admin'
    )
  )
);

drop policy if exists crm_import_runs_read on public.crm_import_runs;
create policy crm_import_runs_read
on public.crm_import_runs
for select
to authenticated
using (
  exists (
    select 1 from public.crm_memberships m
    where m.user_id = (select auth.uid()) and m.enabled
  )
);

drop policy if exists crm_parties_access on public.crm_parties;
create policy crm_parties_access
on public.crm_parties
for all
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

drop policy if exists crm_processes_delete_combined on public.crm_processes;
create policy crm_processes_delete_combined
on public.crm_processes
for delete
to authenticated
using (
  (
    actor_id = (select auth.uid())
    and exists (
      select 1 from public.crm_memberships m
      where m.user_id = (select auth.uid()) and m.enabled
    )
  )
  or exists (
    select 1 from public.crm_memberships m
    where m.user_id = (select auth.uid()) and m.enabled and m.role = 'admin'
  )
);

drop policy if exists crm_processes_insert_own on public.crm_processes;
create policy crm_processes_insert_own
on public.crm_processes
for insert
to authenticated
with check (
  actor_id = (select auth.uid())
  and exists (
    select 1 from public.crm_memberships m
    where m.user_id = (select auth.uid()) and m.enabled
  )
);

drop policy if exists crm_processes_select_combined on public.crm_processes;
create policy crm_processes_select_combined
on public.crm_processes
for select
to authenticated
using (
  (
    actor_id = (select auth.uid())
    and exists (
      select 1 from public.crm_memberships m
      where m.user_id = (select auth.uid()) and m.enabled
    )
  )
  or exists (
    select 1 from public.crm_memberships m
    where m.user_id = (select auth.uid()) and m.enabled and m.role = 'admin'
  )
);

drop policy if exists crm_processes_update_combined on public.crm_processes;
create policy crm_processes_update_combined
on public.crm_processes
for update
to authenticated
using (
  (
    actor_id = (select auth.uid())
    and exists (
      select 1 from public.crm_memberships m
      where m.user_id = (select auth.uid()) and m.enabled
    )
  )
  or exists (
    select 1 from public.crm_memberships m
    where m.user_id = (select auth.uid()) and m.enabled and m.role = 'admin'
  )
)
with check (
  (
    actor_id = (select auth.uid())
    and exists (
      select 1 from public.crm_memberships m
      where m.user_id = (select auth.uid()) and m.enabled
    )
  )
  or exists (
    select 1 from public.crm_memberships m
    where m.user_id = (select auth.uid()) and m.enabled and m.role = 'admin'
  )
);

drop policy if exists crm_source_rows_read on public.crm_source_rows;
create policy crm_source_rows_read
on public.crm_source_rows
for select
to authenticated
using (
  exists (
    select 1 from public.crm_memberships m
    where m.user_id = (select auth.uid()) and m.enabled
  )
);

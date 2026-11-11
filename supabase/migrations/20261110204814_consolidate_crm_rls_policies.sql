-- Consolidate overlapping permissive policies without broadening access.
drop policy if exists crm_completed_admin_read on public.crm_completed_activities;
drop policy if exists crm_completed_select_company_admin on public.crm_completed_activities;
drop policy if exists crm_completed_select_own on public.crm_completed_activities;
create policy crm_completed_select_combined on public.crm_completed_activities
 for select to authenticated using (
  (actor_id=(select auth.uid()) and (
    lower(coalesce((select auth.jwt()->>'email'),''))='intermedioesenegociacoes@gmail.com'
    or exists(select 1 from public.crm_memberships m where m.user_id=(select auth.uid()) and m.enabled)
  ))
  or lower(coalesce((select auth.jwt()->>'email'),''))='intermedioesenegociacoes@gmail.com'
  or exists(select 1 from public.crm_memberships m where m.user_id=(select auth.uid()) and m.enabled and m.role='admin')
 );
drop policy if exists crm_completed_admin_update on public.crm_completed_activities;
drop policy if exists crm_completed_update_own on public.crm_completed_activities;
create policy crm_completed_update_combined on public.crm_completed_activities
 for update to authenticated
 using (
  deleted_at is null and (
   (actor_id=(select auth.uid()) and (
     lower(coalesce((select auth.jwt()->>'email'),''))='intermedioesenegociacoes@gmail.com'
     or exists(select 1 from public.crm_memberships m where m.user_id=(select auth.uid()) and m.enabled)
   ))
   or exists(select 1 from public.crm_memberships m where m.user_id=(select auth.uid()) and m.enabled and m.role='admin')
  )
 )
 with check (
  performed_on<=((now() at time zone 'America/Sao_Paulo')::date)
  and (
   (actor_id=(select auth.uid()) and (
     lower(coalesce((select auth.jwt()->>'email'),''))='intermedioesenegociacoes@gmail.com'
     or exists(select 1 from public.crm_memberships m where m.user_id=(select auth.uid()) and m.enabled)
   ))
   or exists(select 1 from public.crm_memberships m where m.user_id=(select auth.uid()) and m.enabled and m.role='admin')
  )
 );
drop policy if exists crm_membership_admin on public.crm_memberships;
create policy crm_membership_insert_admin on public.crm_memberships for insert to authenticated
 with check (lower(coalesce((select auth.jwt()->>'email'),''))='intermedioesenegociacoes@gmail.com');
create policy crm_membership_update_admin on public.crm_memberships for update to authenticated
 using (lower(coalesce((select auth.jwt()->>'email'),''))='intermedioesenegociacoes@gmail.com')
 with check (lower(coalesce((select auth.jwt()->>'email'),''))='intermedioesenegociacoes@gmail.com');
create policy crm_membership_delete_admin on public.crm_memberships for delete to authenticated
 using (lower(coalesce((select auth.jwt()->>'email'),''))='intermedioesenegociacoes@gmail.com');
drop policy if exists crm_processes_admin_delete on public.crm_processes;
drop policy if exists crm_processes_admin_read on public.crm_processes;
drop policy if exists crm_processes_admin_update on public.crm_processes;
drop policy if exists crm_processes_delete_own on public.crm_processes;
drop policy if exists crm_processes_select_own on public.crm_processes;
drop policy if exists crm_processes_update_own on public.crm_processes;
create policy crm_processes_select_combined on public.crm_processes for select to authenticated using (
 (actor_id=(select auth.uid()) and (
   lower(coalesce((select auth.jwt()->>'email'),''))='intermedioesenegociacoes@gmail.com'
   or exists(select 1 from public.crm_memberships m where m.user_id=(select auth.uid()) and m.enabled)
 ))
 or exists(select 1 from public.crm_memberships m where m.user_id=(select auth.uid()) and m.enabled and m.role='admin')
);
create policy crm_processes_update_combined on public.crm_processes for update to authenticated
 using (
  (actor_id=(select auth.uid()) and (
    lower(coalesce((select auth.jwt()->>'email'),''))='intermedioesenegociacoes@gmail.com'
    or exists(select 1 from public.crm_memberships m where m.user_id=(select auth.uid()) and m.enabled)
  ))
  or exists(select 1 from public.crm_memberships m where m.user_id=(select auth.uid()) and m.enabled and m.role='admin')
 )
 with check (
  (actor_id=(select auth.uid()) and (
    lower(coalesce((select auth.jwt()->>'email'),''))='intermedioesenegociacoes@gmail.com'
    or exists(select 1 from public.crm_memberships m where m.user_id=(select auth.uid()) and m.enabled)
  ))
  or exists(select 1 from public.crm_memberships m where m.user_id=(select auth.uid()) and m.enabled and m.role='admin')
 );
create policy crm_processes_delete_combined on public.crm_processes for delete to authenticated using (
 (actor_id=(select auth.uid()) and (
   lower(coalesce((select auth.jwt()->>'email'),''))='intermedioesenegociacoes@gmail.com'
   or exists(select 1 from public.crm_memberships m where m.user_id=(select auth.uid()) and m.enabled)
 ))
 or exists(select 1 from public.crm_memberships m where m.user_id=(select auth.uid()) and m.enabled and m.role='admin')
);
drop policy if exists crm_source_rows_member_admin_write on public.crm_source_rows;
create policy crm_source_rows_admin_insert on public.crm_source_rows for insert to authenticated
 with check (exists(select 1 from public.crm_memberships m where m.user_id=(select auth.uid()) and m.enabled and m.role='admin'));
create policy crm_source_rows_admin_update on public.crm_source_rows for update to authenticated
 using (exists(select 1 from public.crm_memberships m where m.user_id=(select auth.uid()) and m.enabled and m.role='admin'))
 with check (exists(select 1 from public.crm_memberships m where m.user_id=(select auth.uid()) and m.enabled and m.role='admin'));
create policy crm_source_rows_admin_delete on public.crm_source_rows for delete to authenticated
 using (exists(select 1 from public.crm_memberships m where m.user_id=(select auth.uid()) and m.enabled and m.role='admin'));

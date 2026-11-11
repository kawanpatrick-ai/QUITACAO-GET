-- Preserve the original administrator's ability to edit/delete their own process records.
drop policy if exists crm_processes_update_combined on public.crm_processes;
create policy crm_processes_update_combined on public.crm_processes
 for update to authenticated
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
drop policy if exists crm_processes_delete_combined on public.crm_processes;
create policy crm_processes_delete_combined on public.crm_processes
 for delete to authenticated using (
  (actor_id=(select auth.uid()) and (
    lower(coalesce((select auth.jwt()->>'email'),''))='intermedioesenegociacoes@gmail.com'
    or exists(select 1 from public.crm_memberships m where m.user_id=(select auth.uid()) and m.enabled)
  ))
  or exists(select 1 from public.crm_memberships m where m.user_id=(select auth.uid()) and m.enabled and m.role='admin')
 );

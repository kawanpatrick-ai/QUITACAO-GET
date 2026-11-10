-- The CRM has no anonymous-user use case. Enforce least privilege at the SQL grant layer,
-- in addition to RLS, for every exposed CRM table.
revoke all on schema public from anon, public;
grant usage on schema public to authenticated;

revoke all on table
 public.crm_memberships,
 public.crm_clients,
 public.crm_activities,
 public.crm_parties,
 public.crm_import_runs,
 public.crm_source_rows,
 public.crm_completed_activities,
 public.crm_processes,
 public.crm_unmatched_sources
from anon, public;

grant select,insert,update,delete on table
 public.crm_memberships,
 public.crm_clients,
 public.crm_activities,
 public.crm_parties,
 public.crm_source_rows,
 public.crm_processes,
 public.crm_unmatched_sources
to authenticated;

grant select on table public.crm_import_runs to authenticated;
grant select,insert on table public.crm_completed_activities to authenticated;
grant update (
 title,description,category,performed_on,client_id,contact_confirmed,duration_seconds,
 process_number,process_type,deleted_at,updated_at
) on public.crm_completed_activities to authenticated;

-- Cover foreign keys to keep joins and parent deletes predictable at scale.
create index if not exists crm_activities_actor_id_idx on public.crm_activities(actor_id);
create index if not exists crm_clients_last_attended_by_idx on public.crm_clients(last_attended_by);
create index if not exists crm_clients_verified_by_idx on public.crm_clients(verified_by);
create index if not exists crm_processes_client_id_idx on public.crm_processes(client_id);
create index if not exists crm_unmatched_sources_reviewed_by_idx on public.crm_unmatched_sources(reviewed_by);

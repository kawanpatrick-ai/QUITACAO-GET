-- Idempotent record of the crm_unmatched_sources table introduced to repair
-- the original migration chain. The table is also created before policy setup
-- in 20261109_015_shared_admin_access.sql for clean installs.
create table if not exists public.crm_unmatched_sources (
 source_ref text primary key,
 source_file text not null,
 source_tab text not null,
 source_row integer not null default 0,
 client_name text not null,
 reason text not null,
 snapshot jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 reviewed_at timestamptz,
 reviewed_by uuid references auth.users(id)
);
create index if not exists crm_unmatched_sources_created_idx
 on public.crm_unmatched_sources(created_at desc);
alter table public.crm_unmatched_sources enable row level security;
grant select,insert,update,delete on public.crm_unmatched_sources to authenticated;

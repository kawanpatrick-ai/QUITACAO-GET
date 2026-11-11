-- The import RPC performs privileged business operations under the caller's RLS context.
-- It must not be callable by anonymous clients.
revoke all on function public.crm_import_excel(jsonb) from public, anon;
grant execute on function public.crm_import_excel(jsonb) to authenticated;

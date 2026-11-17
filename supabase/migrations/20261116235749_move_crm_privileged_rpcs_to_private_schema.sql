-- Keep privileged CRM RPC implementation outside the exposed public API schema.
begin;

create schema if not exists private authorization postgres;
revoke all on schema private from public;
revoke all on schema private from anon;
grant usage on schema private to authenticated, service_role;

create or replace function private.crm_create_client(
  p_name text,
  p_document text,
  p_institution text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_doc text := regexp_replace(coalesce(p_document, ''), '[^0-9]', '', 'g');
  v_id uuid;
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.crm_memberships m
    where m.user_id = (select auth.uid()) and m.enabled is true
  ) then
    raise exception 'Acesso não autorizado';
  end if;
  if length(v_name) < 3 or length(v_name) > 250 then
    raise exception 'Informe o nome completo';
  end if;
  if length(v_doc) not in (11, 14) then
    raise exception 'Informe CPF/CNPJ válido em comprimento';
  end if;
  insert into public.crm_clients(
    source_key, name, doc_digits, institution, source_status, source_tab,
    source_spreadsheet, source_tabs, source_row_count, stage, workflow_status
  )
  values(
    'doc:' || v_doc, v_name, v_doc,
    nullif(btrim(coalesce(p_institution, '')), ''),
    'em_andamento', 'Cadastro manual', 'ProjectW1SC',
    array['Cadastro manual'], 1, 'a_analisar', 'ativo'
  )
  returning id into v_id;
  insert into public.crm_activities(client_id, kind, body, actor_id, details)
  values(
    v_id, 'cadastro', 'Cliente cadastrado manualmente no CRM.',
    (select auth.uid()), jsonb_build_object('origem', 'cadastro_manual')
  );
  return v_id;
end
$function$;

revoke all on function private.crm_create_client(text, text, text) from public, anon;
grant execute on function private.crm_create_client(text, text, text) to authenticated, service_role;

create or replace function public.crm_create_client(
  p_name text,
  p_document text,
  p_institution text default null
)
returns uuid
language sql
security invoker
set search_path to 'public', 'private', 'pg_temp'
as $function$
  select private.crm_create_client(p_name, p_document, p_institution);
$function$;

revoke all on function public.crm_create_client(text, text, text) from public, anon;
grant execute on function public.crm_create_client(text, text, text) to authenticated, service_role;


create or replace function private.crm_import_excel(p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  r jsonb;
  v_doc text;
  v_name text;
  v_ref text;
  v_tab text;
  v_status text;
  v_id uuid;
  v_added integer := 0;
  v_unmatched integer := 0;
  v_institution text;
  v_phone text;
  v_contact text;
  v_note text;
  v_tags text[];
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.crm_memberships m
    where m.user_id = (select auth.uid()) and m.enabled is true and m.role = 'admin'
  ) then
    raise exception 'Acesso não autorizado à importação.';
  end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 150 then
    raise exception 'Envie entre 1 e 150 registros por vez.';
  end if;
  for r in select value from jsonb_array_elements(p_rows)
  loop
    v_doc := regexp_replace(coalesce(r->>'doc_digits', ''), '[^0-9]', '', 'g');
    v_name := left(btrim(coalesce(r->>'name', '')), 250);
    v_ref := left(btrim(coalesce(r->>'source_ref', '')), 700);
    v_tab := left(btrim(coalesce(r->>'source_tab', '')), 125);
    v_status := coalesce(nullif(r->>'source_status', ''), 'historico');
    v_institution := left(coalesce(r->>'institution', ''), 180);
    v_phone := left(coalesce(r->>'phone', ''), 100);
    v_contact := left(coalesce(r->>'contacted_party', ''), 180);
    v_note := left(coalesce(r->>'notes', ''), 5000);
    if v_ref = '' or v_name = '' or v_tab = '' then
      continue;
    end if;
    if length(v_doc) not in (11, 14) then
      insert into public.crm_unmatched_sources(
        source_ref, source_file, source_tab, source_row, client_name, reason, snapshot
      )
      values(
        v_ref, 'Excel - importação autorizada', v_tab,
        coalesce((r->>'source_row')::integer, 0), v_name,
        'Documento ausente/inválido; revisar antes de associar', r
      )
      on conflict(source_ref) do update
        set snapshot = excluded.snapshot, reason = excluded.reason;
      v_unmatched := v_unmatched + 1;
      continue;
    end if;
    v_tags := array['Excel: ' || v_tab];
    insert into public.crm_clients (
      source_key, name, doc_digits, phone, consultant, institution, contacted_party,
      source_status, source_tab, source_spreadsheet, source_conflict, source_tabs, source_row_count,
      sale_amount, sale_date, last_contact, next_return, debtor_balance, estimated_amount,
      current_amount, notes, source_seen_at
    )
    values (
      'doc:' || v_doc, v_name, v_doc, v_phone,
      left(coalesce(r->>'consultant', ''), 150), v_institution, v_contact,
      v_status, v_tab, 'Excel - importação autorizada', (v_tab = 'Inconsistência'), v_tags, 1,
      nullif(r->>'sale_amount', '')::numeric, nullif(r->>'sale_date', '')::date,
      nullif(r->>'last_contact', '')::date, nullif(r->>'next_return', '')::date,
      nullif(r->>'debtor_balance', '')::numeric, nullif(r->>'estimated_amount', '')::numeric,
      nullif(r->>'current_amount', '')::numeric, v_note, now()
    )
    on conflict(source_key) do update set
      phone = coalesce(nullif(public.crm_clients.phone, ''), nullif(excluded.phone, '')),
      consultant = coalesce(nullif(public.crm_clients.consultant, ''), nullif(excluded.consultant, '')),
      institution = coalesce(nullif(public.crm_clients.institution, ''), nullif(excluded.institution, '')),
      contacted_party = coalesce(nullif(public.crm_clients.contacted_party, ''), nullif(excluded.contacted_party, '')),
      sale_amount = coalesce(public.crm_clients.sale_amount, excluded.sale_amount),
      sale_date = coalesce(public.crm_clients.sale_date, excluded.sale_date),
      last_contact = coalesce(public.crm_clients.last_contact, excluded.last_contact),
      next_return = coalesce(public.crm_clients.next_return, excluded.next_return),
      debtor_balance = coalesce(public.crm_clients.debtor_balance, excluded.debtor_balance),
      estimated_amount = coalesce(public.crm_clients.estimated_amount, excluded.estimated_amount),
      current_amount = coalesce(public.crm_clients.current_amount, excluded.current_amount),
      notes = coalesce(nullif(public.crm_clients.notes, ''), nullif(excluded.notes, '')),
      source_tabs = (
        select array_agg(distinct tag)
        from unnest(public.crm_clients.source_tabs || excluded.source_tabs) as tag
      ),
      source_conflict = public.crm_clients.source_conflict or excluded.source_conflict
        or (excluded.source_status = 'quitado_na_planilha' and public.crm_clients.source_status in ('em_andamento', 'vencido'))
        or (public.crm_clients.source_status = 'quitado_na_planilha' and excluded.source_status in ('em_andamento', 'vencido')),
      updated_at = now(),
      source_seen_at = now()
    returning id into v_id;
    insert into public.crm_source_rows(
      source_ref, client_id, source_spreadsheet, source_tab, source_row, snapshot, seen_at
    )
    values(
      v_ref, v_id, 'Excel - importação autorizada', v_tab,
      coalesce((r->>'source_row')::integer, 0), r, now()
    )
    on conflict(source_ref) do update
      set client_id = excluded.client_id, snapshot = excluded.snapshot, seen_at = now();
    v_added := v_added + 1;
  end loop;
  return jsonb_build_object('processed', v_added, 'need_review', v_unmatched);
end
$function$;

revoke all on function private.crm_import_excel(jsonb) from public, anon;
grant execute on function private.crm_import_excel(jsonb) to authenticated, service_role;

create or replace function public.crm_import_excel(p_rows jsonb)
returns jsonb
language sql
security invoker
set search_path to 'public', 'private', 'pg_temp'
as $function$
  select private.crm_import_excel(p_rows);
$function$;

revoke all on function public.crm_import_excel(jsonb) from public, anon;
grant execute on function public.crm_import_excel(jsonb) to authenticated, service_role;

commit;

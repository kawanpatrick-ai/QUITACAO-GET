-- Remove autorizacoes antigas por e-mail fixo. Todas as operacoes exigem membership ativa.
create or replace function public.crm_create_client(p_name text,p_document text,p_institution text default null)
returns uuid language plpgsql set search_path=public,pg_temp as $function$
declare v_name text:=btrim(coalesce(p_name,'')); v_doc text:=regexp_replace(coalesce(p_document,''),'[^0-9]','','g'); v_id uuid;
begin
 if (select auth.uid()) is null or not exists(select 1 from public.crm_memberships m where m.user_id=(select auth.uid()) and m.enabled is true) then raise exception 'Acesso não autorizado';end if;
 if length(v_name)<3 or length(v_name)>250 then raise exception 'Informe o nome completo';end if;
 if length(v_doc) not in (11,14) then raise exception 'Informe CPF/CNPJ válido em comprimento';end if;
 insert into public.crm_clients(source_key,name,doc_digits,institution,source_status,source_tab,source_spreadsheet,source_tabs,source_row_count,stage,workflow_status)
 values('doc:'||v_doc,v_name,v_doc,nullif(btrim(coalesce(p_institution,'')),''),'em_andamento','Cadastro manual','ProjectW1SC',array['Cadastro manual'],1,'a_analisar','ativo')
 returning id into v_id;
 insert into public.crm_activities(client_id,kind,body,actor_id,details)
 values(v_id,'cadastro','Cliente cadastrado manualmente no CRM.',(select auth.uid()),jsonb_build_object('origem','cadastro_manual'));
 return v_id;
end
$function$;
revoke all on function public.crm_create_client(text,text,text) from public,anon;
grant execute on function public.crm_create_client(text,text,text) to authenticated;

create or replace function public.crm_add_client_note(p_client_id uuid,p_body text)
returns jsonb language plpgsql set search_path=public,pg_temp as $function$
declare v_text text:=btrim(coalesce(p_body,'')); v_id uuid;
begin
 if (select auth.uid()) is null or not exists(select 1 from public.crm_memberships m where m.user_id=(select auth.uid()) and m.enabled is true) then raise exception 'Conta sem permissão para registrar anotações.';end if;
 if char_length(v_text)<3 or char_length(v_text)>4000 then raise exception 'Anotação deve ter de 3 a 4000 caracteres.';end if;
 if not exists(select 1 from public.crm_clients where id=p_client_id) then raise exception 'Cliente não encontrado.';end if;
 insert into public.crm_activities(client_id,kind,body,actor_id,details)
 values(p_client_id,'anotacao',v_text,(select auth.uid()),jsonb_build_object('origem','anotacao_manual','registrado_em',now()))
 returning id into v_id;
 return jsonb_build_object('id',v_id,'kind','anotacao');
end
$function$;
revoke all on function public.crm_add_client_note(uuid,text) from public,anon;
grant execute on function public.crm_add_client_note(uuid,text) to authenticated;

create or replace function public.crm_update_client(p_client_id uuid,p_patch jsonb,p_reason text default '')
returns jsonb language plpgsql set search_path=public,pg_temp as $function$
declare v_current public.crm_clients%rowtype; v_saved public.crm_clients%rowtype; v_status text; v_priority text; v_reason text:=left(btrim(coalesce(p_reason,'')),2000); v_key text;
begin
 if (select auth.uid()) is null or not exists(select 1 from public.crm_memberships m where m.user_id=(select auth.uid()) and m.enabled is true) then raise exception 'Sem autorização para editar o CRM.';end if;
 if p_patch is null or jsonb_typeof(p_patch)<>'object' or p_patch='{}'::jsonb then raise exception 'Informe o que deseja alterar.';end if;
 for v_key in select jsonb_object_keys(p_patch) loop
  if v_key not in ('name','phone','consultant','institution','contacted_party','assigned_to','priority_level','due_override','workflow_status','notes') then raise exception 'Campo de edição não permitido: %',v_key;end if;
 end loop;
 select * into v_current from public.crm_clients where id=p_client_id for update;
 if not found then raise exception 'Cliente não encontrado.';end if;
 v_status:=case when p_patch?'workflow_status' then p_patch->>'workflow_status' else v_current.workflow_status end;
 v_priority:=case when p_patch?'priority_level' then p_patch->>'priority_level' else v_current.priority_level end;
 if v_status not in ('ativo','finalizado') then raise exception 'Situação inválida.';end if;
 if v_priority not in ('normal','alta','urgente') then raise exception 'Prioridade inválida.';end if;
 if p_patch?'name' and length(btrim(coalesce(p_patch->>'name','')))<3 then raise exception 'Nome do cliente deve ter pelo menos 3 caracteres.';end if;
 if p_patch?'due_override' and nullif(p_patch->>'due_override','') is not null and (p_patch->>'due_override') !~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}$' then raise exception 'Data de retorno inválida.';end if;
 if v_status<>v_current.workflow_status and length(v_reason)<3 then raise exception 'Descreva o motivo para finalizar ou reabrir o atendimento.';end if;
 update public.crm_clients set name=case when p_patch?'name' then btrim(p_patch->>'name') else name end,
  phone=case when p_patch?'phone' then nullif(btrim(p_patch->>'phone'),'') else phone end,
  consultant=case when p_patch?'consultant' then nullif(btrim(p_patch->>'consultant'),'') else consultant end,
  institution=case when p_patch?'institution' then nullif(btrim(p_patch->>'institution'),'') else institution end,
  contacted_party=case when p_patch?'contacted_party' then nullif(btrim(p_patch->>'contacted_party'),'') else contacted_party end,
  assigned_to=case when p_patch?'assigned_to' then nullif(btrim(p_patch->>'assigned_to'),'') else assigned_to end,
  priority_level=v_priority,due_override=case when p_patch?'due_override' then nullif(p_patch->>'due_override','')::date else due_override end,
  notes=case when p_patch?'notes' then nullif(btrim(p_patch->>'notes'),'') else notes end,workflow_status=v_status,
  stage=case when v_status='finalizado' then 'concluido' when v_current.workflow_status='finalizado' and v_status='ativo' and stage in ('concluido','arquivado') then 'a_analisar' else stage end,
  finished_at=case when v_status='finalizado' then coalesce(finished_at,now()) else null end,
  finish_reason=case when v_status='finalizado' and v_current.workflow_status<>'finalizado' then v_reason when v_status='ativo' then null else finish_reason end,
  updated_at=now() where id=p_client_id returning * into v_saved;
 insert into public.crm_activities(client_id,kind,body,actor_id,details)
 values(p_client_id,case when v_status<>v_current.workflow_status then 'situacao' else 'edicao' end,
  case when v_status<>v_current.workflow_status then (case when v_status='finalizado' then 'Atendimento finalizado: ' else 'Atendimento reaberto: ' end)||v_reason else coalesce(nullif(v_reason,''),'Dados ou prioridade do cliente atualizados') end,
  (select auth.uid()),jsonb_build_object('alteracoes',p_patch,'situacao_anterior',v_current.workflow_status,'situacao_atual',v_status));
 return jsonb_build_object('id',v_saved.id,'workflow_status',v_saved.workflow_status,'priority_level',v_saved.priority_level,'due_date',coalesce(v_saved.due_override,v_saved.next_return));
end
$function$;
revoke all on function public.crm_update_client(uuid,jsonb,text) from public,anon;
grant execute on function public.crm_update_client(uuid,jsonb,text) to authenticated;

create or replace function public.crm_register_attendance(p_client_id uuid,p_body text,p_channel text,p_outcome text,p_next_due date default null,p_responsible text default null)
returns jsonb language plpgsql set search_path=public,pg_temp as $function$
declare v_current public.crm_clients%rowtype; v_saved public.crm_clients%rowtype; v_body text:=btrim(coalesce(p_body,'')); v_responsible text:=left(btrim(coalesce(p_responsible,'')),150); v_channel text:=lower(btrim(coalesce(p_channel,''))); v_outcome text:=lower(btrim(coalesce(p_outcome,'')));
begin
 if (select auth.uid()) is null or not exists(select 1 from public.crm_memberships m where m.user_id=(select auth.uid()) and m.enabled is true) then raise exception 'Sem autorização para registrar atendimentos.';end if;
 if length(v_body)<5 or length(v_body)>4000 then raise exception 'Descreva o atendimento ou tentativa com 5 a 4000 caracteres.';end if;
 if v_channel not in ('whatsapp','ligacao','email','presencial','outro') then raise exception 'Canal inválido.';end if;
 if v_outcome not in ('contatado','sem_resposta','em_negociacao','aguardando_resposta','outro') then raise exception 'Resultado inválido.';end if;
 select * into v_current from public.crm_clients where id=p_client_id for update;
 if not found then raise exception 'Cliente não encontrado.';end if;
 if v_current.workflow_status='finalizado' then raise exception 'Este cliente está finalizado. Reabra o caso antes de registrar atendimento.';end if;
 update public.crm_clients set last_contact=(now() at time zone 'America/Sao_Paulo')::date,last_attendance_at=now(),last_attended_by=(select auth.uid()),
  assigned_to=coalesce(nullif(v_responsible,''),assigned_to),due_override=coalesce(p_next_due,due_override),
  stage=case when v_outcome='contatado' then 'contatado' when v_outcome='em_negociacao' then 'em_negociacao' when v_outcome='aguardando_resposta' then 'aguardando_resposta' else stage end,
  updated_at=now() where id=p_client_id returning * into v_saved;
 insert into public.crm_activities(client_id,kind,body,actor_id,details)
 values(p_client_id,'atendimento',v_body,(select auth.uid()),jsonb_build_object('canal',v_channel,'resultado',v_outcome,
  'proximo_retorno_anterior',coalesce(v_current.due_override,v_current.next_return),'proximo_retorno',coalesce(v_saved.due_override,v_saved.next_return),
  'responsavel',coalesce(nullif(v_responsible,''),auth.jwt()->>'email'),'registrado_em',now()));
 return jsonb_build_object('id',v_saved.id,'last_contact',v_saved.last_contact,'next_return',coalesce(v_saved.due_override,v_saved.next_return),'stage',v_saved.stage);
end
$function$;
revoke all on function public.crm_register_attendance(uuid,text,text,text,date,text) from public,anon;
grant execute on function public.crm_register_attendance(uuid,text,text,text,date,text) to authenticated;

create or replace function public.crm_import_excel(p_rows jsonb)
returns jsonb language plpgsql set search_path=public,pg_temp as $function$
declare r jsonb; v_doc text; v_name text; v_ref text; v_tab text; v_status text; v_id uuid; v_added integer:=0; v_unmatched integer:=0; v_institution text; v_phone text; v_contact text; v_note text; v_tags text[];
begin
 if (select auth.uid()) is null or not exists(select 1 from public.crm_memberships m where m.user_id=(select auth.uid()) and m.enabled is true and m.role='admin') then raise exception 'Acesso não autorizado à importação.';end if;
 if jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows)>150 then raise exception 'Envie entre 1 e 150 registros por vez.';end if;
 for r in select value from jsonb_array_elements(p_rows) loop
  v_doc:=regexp_replace(coalesce(r->>'doc_digits',''),'[^0-9]','','g');v_name:=left(btrim(coalesce(r->>'name','')),250);
  v_ref:=left(btrim(coalesce(r->>'source_ref','')),700);v_tab:=left(btrim(coalesce(r->>'source_tab','')),125);
  v_status:=coalesce(nullif(r->>'source_status',''),'historico');v_institution:=left(coalesce(r->>'institution',''),180);
  v_phone:=left(coalesce(r->>'phone',''),100);v_contact:=left(coalesce(r->>'contacted_party',''),180);v_note:=left(coalesce(r->>'notes',''),5000);
  if v_ref='' or v_name='' or v_tab='' then continue;end if;
  if length(v_doc) not in (11,14) then
   insert into public.crm_unmatched_sources(source_ref,source_file,source_tab,source_row,client_name,reason,snapshot)
   values(v_ref,'Excel - importação autorizada',v_tab,coalesce((r->>'source_row')::integer,0),v_name,'Documento ausente/inválido; revisar antes de associar',r)
   on conflict(source_ref) do update set snapshot=excluded.snapshot,reason=excluded.reason;
   v_unmatched:=v_unmatched+1;continue;
  end if;
  v_tags:=ARRAY['Excel: '||v_tab];
  insert into public.crm_clients(source_key,name,doc_digits,phone,consultant,institution,contacted_party,source_status,source_tab,source_spreadsheet,source_conflict,source_tabs,source_row_count,sale_amount,sale_date,last_contact,next_return,debtor_balance,estimated_amount,current_amount,notes,source_seen_at)
  values('doc:'||v_doc,v_name,v_doc,v_phone,left(coalesce(r->>'consultant',''),150),v_institution,v_contact,v_status,v_tab,'Excel - importação autorizada',(v_tab='Inconsistência'),v_tags,1,
   nullif(r->>'sale_amount','')::numeric,nullif(r->>'sale_date','')::date,nullif(r->>'last_contact','')::date,nullif(r->>'next_return','')::date,
   nullif(r->>'debtor_balance','')::numeric,nullif(r->>'estimated_amount','')::numeric,nullif(r->>'current_amount','')::numeric,v_note,now())
  on conflict(source_key) do update set phone=coalesce(nullif(public.crm_clients.phone,''),nullif(excluded.phone,'')),consultant=coalesce(nullif(public.crm_clients.consultant,''),nullif(excluded.consultant,'')),
   institution=coalesce(nullif(public.crm_clients.institution,''),nullif(excluded.institution,'')),contacted_party=coalesce(nullif(public.crm_clients.contacted_party,''),nullif(excluded.contacted_party,'')),
   sale_amount=coalesce(public.crm_clients.sale_amount,excluded.sale_amount),sale_date=coalesce(public.crm_clients.sale_date,excluded.sale_date),
   last_contact=coalesce(public.crm_clients.last_contact,excluded.last_contact),next_return=coalesce(public.crm_clients.next_return,excluded.next_return),
   debtor_balance=coalesce(public.crm_clients.debtor_balance,excluded.debtor_balance),estimated_amount=coalesce(public.crm_clients.estimated_amount,excluded.estimated_amount),
   current_amount=coalesce(public.crm_clients.current_amount,excluded.current_amount),notes=coalesce(nullif(public.crm_clients.notes,''),nullif(excluded.notes,'')),
   source_tabs=(select array_agg(distinct tag) from unnest(public.crm_clients.source_tabs||excluded.source_tabs) as tag),
   source_conflict=public.crm_clients.source_conflict or excluded.source_conflict
    or (excluded.source_status='quitado_na_planilha' and public.crm_clients.source_status in ('em_andamento','vencido'))
    or (public.crm_clients.source_status='quitado_na_planilha' and excluded.source_status in ('em_andamento','vencido')),
   updated_at=now(),source_seen_at=now()
  returning id into v_id;
  insert into public.crm_source_rows(source_ref,client_id,source_spreadsheet,source_tab,source_row,snapshot,seen_at)
  values(v_ref,v_id,'Excel - importação autorizada',v_tab,coalesce((r->>'source_row')::integer,0),r,now())
  on conflict(source_ref) do update set client_id=excluded.client_id,snapshot=excluded.snapshot,seen_at=now();
  v_added:=v_added+1;
 end loop;
 return jsonb_build_object('processed',v_added,'need_review',v_unmatched);
end
$function$;
revoke all on function public.crm_import_excel(jsonb) from public,anon;
grant execute on function public.crm_import_excel(jsonb) to authenticated;

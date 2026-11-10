-- Evaluate auth.jwt() as a statement-level initplan instead of once per row.
-- Supabase's RLS linter specifically recommends selecting the JWT first, then reading its claim.
do $$
declare
 p record;
 v_qual text;
 v_check text;
 v_old text := '( SELECT (auth.jwt() ->> ''email''::text))';
 v_new text := '(( SELECT auth.jwt()) ->> ''email''::text)';
begin
 for p in
  select schemaname,tablename,policyname,qual,with_check
  from pg_policies
  where schemaname='public'
    and (coalesce(qual,'') like '%auth.jwt()%' or coalesce(with_check,'') like '%auth.jwt()%')
 loop
  v_qual:=case when p.qual is null then null else replace(p.qual,v_old,v_new) end;
  v_check:=case when p.with_check is null then null else replace(p.with_check,v_old,v_new) end;
  if p.qual is not null and v_qual is distinct from p.qual then
   execute format('alter policy %I on %I.%I using (%s)',p.policyname,p.schemaname,p.tablename,v_qual);
  end if;
  if p.with_check is not null and v_check is distinct from p.with_check then
   execute format('alter policy %I on %I.%I with check (%s)',p.policyname,p.schemaname,p.tablename,v_check);
  end if;
 end loop;
end $$;

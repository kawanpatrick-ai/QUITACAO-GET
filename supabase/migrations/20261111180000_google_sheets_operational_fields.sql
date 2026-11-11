-- Campos operacionais importados da planilha de acompanhamento do setor de Quitação.
-- Os valores originais de todas as colunas permanecem também em crm_source_rows.snapshot.
alter table public.crm_clients
  add column if not exists operational_status_code text,
  add column if not exists operational_status_description text,
  add column if not exists source_month text,
  add column if not exists homologation_signed boolean,
  add column if not exists contract_age_days integer,
  add column if not exists sheet_reference_date date,
  add column if not exists waiting_business_days integer,
  add column if not exists info_document_date date,
  add column if not exists overdue_installments integer,
  add column if not exists source_observations text,
  add column if not exists source_contact text,
  add column if not exists last_financial_negotiation date,
  add column if not exists source_row_number integer,
  add column if not exists source_workbook_id text;

create index if not exists crm_clients_operational_status_idx
  on public.crm_clients(operational_status_code);

create index if not exists crm_clients_source_month_idx
  on public.crm_clients(source_month);

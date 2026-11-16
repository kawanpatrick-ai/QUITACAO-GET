import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync(new URL('../supabase/migrations/20261116160000_harden_client_activity_and_logo_permissions.sql', import.meta.url), 'utf8');

test('operators cannot insert or delete CRM clients directly, nor truncate the table', () => {
  assert.match(migration, /revoke all privileges on table public\.crm_clients from authenticated/i);
  assert.match(migration, /grant select, update on table public\.crm_clients to authenticated/i);
});

test('audit activities are append-only and inserts must belong to the signed-in actor', () => {
  assert.match(migration, /grant select, insert on table public\.crm_activities to authenticated/i);
  assert.match(migration, /create policy crm_activities_insert_own[\s\S]*?actor_id = \(select auth\.uid\(\)\)/i);
  assert.match(migration, /for select[\s\S]*?for insert/i);
});

test('institution logos no longer authorize the legacy hard-coded email', () => {
  assert.doesNotMatch(migration, /intermedioesenegociacoes@gmail\.com/i);
  assert.match(migration, /drop policy if exists crm_institution_logos_insert on storage\.objects/i);
  assert.match(migration, /drop policy if exists crm_institution_logos_delete on storage\.objects/i);
  assert.match(migration, /crm_institution_logos_select[\s\S]*?crm_memberships[\s\S]*?m\.enabled/i);
});

test('admin-checked RPCs retain their ability to write clients after direct INSERT is revoked', () => {
  assert.match(migration, /alter function public\.crm_create_client\(text, text, text\) security definer/i);
  assert.match(migration, /alter function public\.crm_import_excel\(jsonb\) security definer/i);
  assert.match(migration, /set search_path to 'public', 'pg_temp'/i);
});

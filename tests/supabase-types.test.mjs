import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

test('Supabase client is typed against the generated production schema', async () => {
  const client = await readFile(new URL('lib/supabase-client.ts', root), 'utf8');
  const types = await readFile(new URL('types/supabase.ts', root), 'utf8');
  assert.match(client, /createClient<Database>/);
  assert.match(client, /import type \{ Database \}/);
  for (const table of ['crm_clients','crm_activities','crm_parties','crm_processes','crm_memberships','crm_completed_activities','crm_import_runs','crm_source_rows','crm_unmatched_sources']) {
    assert.match(types, new RegExp(table + ':'));
  }
});

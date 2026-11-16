import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

test('domain contracts cover every live CRM table and operational status', async () => {
  const types = await readFile(new URL('features/crm/types.ts', root), 'utf8');
  for (const name of ['ClientRow','ClientInsert','ClientPatch','ClientStage','ClientWorkflowStatus','EvidenceStatus','PriorityLevel','MembershipRole','ProcessType','CompletedActivityCategory','Activity','CompletedActivity','Process','Institution','Membership','ImportRun','SourceRow','UnmatchedSource','ClientListFilters','PageResult']) {
    assert.match(types, new RegExp('\\b' + name + '\\b'));
  }
  assert.match(types, /'quitacao_verificada'/);
  assert.match(types, /'busca_apreensao'/);
  assert.match(types, /'admin' \| 'operator'/);
});

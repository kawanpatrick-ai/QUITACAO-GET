import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSyncPayload } from '../lib/sync-payload.mjs';

test('a sync preserves CRM-edited fields for an existing client', () => {
  const grouped = [{
    source_key: 'doc:12345678901',
    name: 'Name from spreadsheet',
    doc_digits: '12345678901',
    phone: '1111-1111',
    consultant: 'Spreadsheet consultant',
    institution: 'Spreadsheet institution',
    contacted_party: 'Spreadsheet contact',
    last_contact: '2026-01-01',
    next_return: '2026-01-02',
    notes: '',
    source_status: 'vencido',
    source_tab: 'VENCIDOS',
    source_spreadsheet: 'sheet-1',
    source_conflict: false,
    source_tabs: ['VENCIDOS'],
    source_row_count: 1,
    sale_amount: 1000,
    sale_date: '2026-01-01',
    debtor_balance: 900,
    estimated_amount: 800,
    current_amount: 700,
    last_negotiation: '2026-01-03'
  }];
  const payload = buildSyncPayload(grouped, [{ source_key: 'doc:12345678901' }], '2026-02-01T00:00:00.000Z');

  assert.equal(payload.length, 1);
  assert.equal(payload[0].source_status, 'vencido');
  assert.equal(payload[0].debtor_balance, 900);
  assert.equal(payload[0].sale_amount, 1000);
  assert.equal(payload[0].source_seen_at, '2026-02-01T00:00:00.000Z');
  for (const field of ['name','doc_digits','phone','consultant','institution','contacted_party','last_contact','next_return','notes','updated_at']) {
    assert.equal(Object.hasOwn(payload[0], field), false, field + ' must not be overwritten during sync');
  }
});

test('a sync sends a complete record for a client not yet in CRM', () => {
  const grouped = [{
    source_key: 'doc:12345678901',
    name: 'New client',
    doc_digits: '12345678901',
    phone: null,
    consultant: null,
    institution: 'Bank',
    contacted_party: null,
    source_status: 'em_andamento',
    source_tab: 'ANDAMENTO',
    source_spreadsheet: 'sheet-1',
    source_conflict: false,
    source_tabs: ['ANDAMENTO'],
    source_row_count: 1,
    sale_amount: null,
    sale_date: null,
    last_contact: null,
    next_return: null,
    debtor_balance: null,
    estimated_amount: null,
    current_amount: null,
    last_negotiation: null,
    notes: null
  }];
  const payload = buildSyncPayload(grouped, [], '2026-02-01T00:00:00.000Z');

  assert.equal(payload[0].name, 'New client');
  assert.equal(payload[0].institution, 'Bank');
  assert.equal(payload[0].phone, null);
  assert.equal(payload[0].updated_at, '2026-02-01T00:00:00.000Z');
});

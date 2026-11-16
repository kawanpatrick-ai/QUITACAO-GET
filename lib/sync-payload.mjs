const SOURCE_FIELDS = [
  'source_status',
  'source_tab',
  'source_spreadsheet',
  'source_conflict',
  'source_tabs',
  'source_row_count',
];

const FINANCIAL_FIELDS = [
  'sale_amount',
  'sale_date',
  'debtor_balance',
  'estimated_amount',
  'current_amount',
  'last_negotiation',
];

const NEW_CLIENT_FIELDS = [
  'name',
  'doc_digits',
  'phone',
  'consultant',
  'institution',
  'contacted_party',
  'last_contact',
  'next_return',
  'notes',
  ...SOURCE_FIELDS,
  ...FINANCIAL_FIELDS,
];

export function buildSyncPayload(groupedClients, existingRows, now) {
  const existingKeys = new Set((existingRows || []).map(row => row.source_key));

  return groupedClients.map(client => {
    const isExisting = existingKeys.has(client.source_key);
    const fields = isExisting
      ? ['source_key', 'source_seen_at', ...SOURCE_FIELDS, ...FINANCIAL_FIELDS]
      : ['source_key', 'source_seen_at', 'updated_at', ...NEW_CLIENT_FIELDS];

    const payload = {};
    for (const field of fields) {
      payload[field] = field === 'source_seen_at' || field === 'updated_at'
        ? now
        : (client[field] ?? null);
    }
    return payload;
  });
}

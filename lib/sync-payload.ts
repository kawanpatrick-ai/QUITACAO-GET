import type { GroupedClient } from "./normalize.ts";

type PayloadValue = string | number | boolean | string[] | null;

export interface SyncPayloadRow {
  source_key: string;
  source_seen_at: string;
  updated_at?: string;
  [field: string]: PayloadValue | undefined;
}

const SOURCE_FIELDS = [
  "source_status", "source_tab", "source_spreadsheet",
  "source_conflict", "source_tabs", "source_row_count",
] as const satisfies readonly (keyof GroupedClient)[];

const FINANCIAL_FIELDS = [
  "sale_amount", "sale_date", "debtor_balance",
  "estimated_amount", "current_amount", "last_negotiation",
] as const satisfies readonly (keyof GroupedClient)[];

const NEW_CLIENT_FIELDS = [
  "name", "doc_digits", "phone", "consultant", "institution",
  "contacted_party", "last_contact", "next_return", "notes",
  ...SOURCE_FIELDS, ...FINANCIAL_FIELDS,
] as const satisfies readonly (keyof GroupedClient)[];

type PayloadField = keyof GroupedClient | "source_seen_at" | "updated_at";

export function buildSyncPayload(
  groupedClients: readonly GroupedClient[],
  existingRows: readonly { source_key: string }[],
  now: string,
): SyncPayloadRow[] {
  const existingKeys = new Set(existingRows.map((row) => row.source_key));

  return groupedClients.map((client) => {
    const isExisting = existingKeys.has(client.source_key);
    const fields: readonly PayloadField[] = isExisting
      ? ["source_key", "source_seen_at", ...SOURCE_FIELDS, ...FINANCIAL_FIELDS]
      : ["source_key", "source_seen_at", "updated_at", ...NEW_CLIENT_FIELDS];

    const payload: Record<string, PayloadValue> = {};
    for (const field of fields) {
      payload[field] =
        field === "source_seen_at" || field === "updated_at"
          ? now
          : client[field] ?? null;
    }
    return payload as SyncPayloadRow;
  });
}

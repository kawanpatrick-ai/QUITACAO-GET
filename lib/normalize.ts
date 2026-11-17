// Importação de planilhas GET: normalização explícita e contratos tipados.
export type ImportTab = "ANDAMENTO" | "VENCIDOS" | "QUITADOS" | "FINALIZADOS";
export type SourceStatus =
  | "em_andamento"
  | "vencido"
  | "quitado_na_planilha"
  | "finalizado_na_planilha";

export interface ImportedSourceRow {
  source_ref: string;
  source_spreadsheet: string;
  source_tab: ImportTab;
  source_row: number;
  source_status: SourceStatus;
  name: string;
  doc_digits: string;
  phone: string;
  consultant: string;
  institution: string;
  contacted_party: string;
  sale_amount: number | null;
  sale_date: string | null;
  last_contact: string | null;
  next_return: string | null;
  debtor_balance: number | null;
  estimated_amount: number | null;
  current_amount: number | null;
  notes: string;
  last_negotiation: string | null;
  raw: readonly unknown[];
}

export interface GroupedClient {
  source_key: string;
  name: string | null;
  doc_digits: string;
  phone: string | null;
  consultant: string | null;
  institution: string | null;
  contacted_party: string | null;
  sale_amount: number | null;
  sale_date: string | null;
  last_contact: string | null;
  next_return: string | null;
  debtor_balance: number | null;
  estimated_amount: number | null;
  current_amount: number | null;
  notes: string | null;
  last_negotiation: string | null;
  source_status: SourceStatus;
  source_tab: ImportTab;
  source_spreadsheet: string;
  source_conflict: boolean;
  source_tabs: ImportTab[];
  source_row_count: number;
}

export interface ImportedParty {
  name: string;
  contact: string;
  kind: "financeira" | "assessoria";
}

const IMPORT_TABS: ReadonlySet<string> = new Set([
  "ANDAMENTO", "VENCIDOS", "QUITADOS", "FINALIZADOS",
]);

const MAP_STATUS: Record<ImportTab, SourceStatus> = {
  ANDAMENTO: "em_andamento",
  VENCIDOS: "vencido",
  QUITADOS: "quitado_na_planilha",
  FINALIZADOS: "finalizado_na_planilha",
};

const text = (value: unknown): string => String(value ?? "").trim();

export const normalizedDoc = (value: unknown): string =>
  String(value ?? "").replace(/\D/g, "");

export const hasDocument = (value: unknown): boolean =>
  [11, 14].includes(normalizedDoc(value).length);

export function moneyBR(value: unknown): number | null {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  let normalized = String(value).replace(/[^0-9,.\-]/g, "").trim();
  if (!normalized) return null;
  if (normalized.includes(",")) normalized = normalized.replace(/\./g, "").replace(",", ".");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : null;
}

export function dateBR(value: unknown): string | null {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const input = String(value).trim();
  const match = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return /^20\d\d-\d\d-\d\d$/.test(input) ? input : null;
  const first = Number(match[1]);
  const second = Number(match[2]);
  const year = Number(match[3]);
  if (year < 2000 || year > 2100) return null;

  // A planilha mistura DD/MM/AAAA com datas importadas em MM/DD/AAAA.
  let day = first;
  let month = second;
  if (second > 12 && first <= 12) {
    day = second;
    month = first;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) return null;

  return [
    String(year),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

function isTitle(row: readonly unknown[]): boolean {
  const second = text(row[1]).toUpperCase();
  return (
    !second ||
    second === "NOME" ||
    /^(JANEIRO|FEVEREIRO|MARÇO|ABRIL|MAIO|JUNHO|JULHO|AGOSTO|SETEMBRO|OUTUBRO|NOVEMBRO|DEZEMBRO)[\/ ]/i.test(second)
  );
}

export function parseTab(
  tab: string,
  rows: readonly (readonly unknown[])[],
  spreadsheetId: string,
): ImportedSourceRow[] {
  if (!IMPORT_TABS.has(tab)) return [];
  const importTab = tab as ImportTab;
  const result: ImportedSourceRow[] = [];

  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index] ?? [];
    if (isTitle(row)) continue;

    // QUITADOS contém cabeçalhos repetidos entre grupos e não segue as outras abas.
    const isSettledTab = importTab === "QUITADOS";
    const document = normalizedDoc(row[2]);
    if (!hasDocument(document)) continue;
    const name = text(row[1]);
    if (name.length < 3) continue;

    result.push({
      source_ref: \`\${spreadsheetId}:\${importTab}:\${index + 1}\`,
      source_spreadsheet: spreadsheetId,
      source_tab: importTab,
      source_row: index + 1,
      source_status: MAP_STATUS[importTab],
      name,
      doc_digits: document,
      phone: isSettledTab ? "" : text(row[3]),
      consultant: isSettledTab ? text(row[0]) : text(row[4]),
      institution: text(row[isSettledTab ? 3 : 13]),
      contacted_party: isSettledTab ? "" : text(row[19]),
      sale_amount: isSettledTab ? moneyBR(row[7]) : moneyBR(row[5]),
      sale_date: isSettledTab ? dateBR(row[4]) : dateBR(row[6]),
      last_contact: isSettledTab ? null : dateBR(row[10]),
      next_return: isSettledTab ? null : dateBR(row[12]),
      debtor_balance: isSettledTab
        ? moneyBR(row[8])
        : moneyBR(row[importTab === "FINALIZADOS" ? 15 : 14]),
      estimated_amount: isSettledTab
        ? moneyBR(row[9])
        : moneyBR(row[importTab === "FINALIZADOS" ? 16 : 15]),
      current_amount: isSettledTab
        ? moneyBR(row[10])
        : moneyBR(row[importTab === "FINALIZADOS" ? 17 : 16]),
      notes: isSettledTab ? "" : text(row[importTab === "FINALIZADOS" ? 26 : 18]),
      last_negotiation: isSettledTab
        ? dateBR(row[5])
        : dateBR(row[importTab === "FINALIZADOS" ? 21 : 20]),
      raw: row,
    });
  }

  // A aba QUITADOS indica um rótulo da origem, NÃO comprova a quitação.
  return result;
}

export function parseParties(rows: readonly (readonly unknown[])[]): ImportedParty[] {
  const result: ImportedParty[] = [];
  const columns = [[0, 1, "financeira"], [3, 4, "assessoria"]] as const;

  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index] ?? [];
    for (const [nameIndex, contactIndex, kind] of columns) {
      const name = text(row[nameIndex]);
      if (name && name.length > 2 && !/^(bancos|assessorias)$/i.test(name)) {
        result.push({ name, contact: text(row[contactIndex]), kind });
      }
    }
  }
  return result;
}

export function mergeClients(entries: readonly ImportedSourceRow[]): GroupedClient[] {
  const groups = new Map<string, ImportedSourceRow[]>();
  for (const row of entries) {
    const key = \`doc:\${row.doc_digits}\`;
    const group = groups.get(key);
    if (group) group.push(row);
    else groups.set(key, [row]);
  }

  const priority: Record<ImportTab, number> = {
    QUITADOS: 4, FINALIZADOS: 3, VENCIDOS: 2, ANDAMENTO: 1,
  };

  return [...groups].map(([sourceKey, group]) => {
    const sorted = [...group].sort(
      (left, right) => priority[right.source_tab] - priority[left.source_tab],
    );
    const primary = sorted[0];
    const sourceTabs = [...new Set(sorted.map((row) => row.source_tab))];
    const pick = <Key extends keyof ImportedSourceRow>(
      key: Key,
    ): ImportedSourceRow[Key] | null =>
      sorted.map((row) => row[key]).find(
        (value) => value !== null && value !== undefined && value !== "",
      ) ?? null;

    return {
      source_key: sourceKey,
      name: pick("name"),
      doc_digits: primary.doc_digits,
      phone: pick("phone"),
      consultant: pick("consultant"),
      institution: pick("institution"),
      contacted_party: pick("contacted_party"),
      sale_amount: pick("sale_amount"),
      sale_date: pick("sale_date"),
      last_contact: pick("last_contact"),
      next_return: pick("next_return"),
      debtor_balance: pick("debtor_balance"),
      estimated_amount: pick("estimated_amount"),
      current_amount: pick("current_amount"),
      notes: pick("notes"),
      last_negotiation: pick("last_negotiation"),
      source_status: primary.source_status,
      source_tab: primary.source_tab,
      source_spreadsheet: primary.source_spreadsheet,
      source_conflict: sourceTabs.length > 1,
      source_tabs: sourceTabs,
      source_row_count: group.length,
    };
  });
}

import { NextResponse, type NextRequest } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { GoogleAuth, OAuth2Client } from "google-auth-library";
import {
  parseTab,
  parseParties,
  mergeClients,
  type ImportTab,
  type ImportedParty,
} from "../../../lib/normalize";
import { buildSyncPayload } from "../../../lib/sync-payload";
import type { Database, Json } from "../../../types/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;

type SheetTab = ImportTab | "FINANCEIRAS";
type GoogleApiClient = Awaited<ReturnType<GoogleAuth["getClient"]>>;
type SyncError = { spreadsheet?: string; tab: string; error: string };

const ALLOWED_TABS: readonly SheetTab[] = [
  "ANDAMENTO", "VENCIDOS", "QUITADOS", "FINALIZADOS", "FINANCEIRAS",
];

function fail(message: string, status = 500): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

function serverDB(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Configure Supabase no servidor");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function google(): Promise<GoogleApiClient> {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    let credentials: unknown;
    try {
      credentials = JSON.parse(serviceAccountJson) as unknown;
    } catch {
      throw new Error("Credencial JSON da conta de serviço Google inválida");
    }
    const auth = new GoogleAuth({
      credentials: credentials as never,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    return auth.getClient();
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (clientId && clientSecret && refreshToken) {
    const auth = new OAuth2Client(clientId, clientSecret);
    auth.setCredentials({ refresh_token: refreshToken });
    return auth;
  }
  throw new Error("Credenciais Google não configuradas");
}

async function sheet(
  client: GoogleApiClient,
  spreadsheetId: string,
  tab: SheetTab,
): Promise<unknown[][]> {
  const range = encodeURIComponent(`'${tab}'!A1:AE2000`);
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${range}?valueRenderOption=FORMATTED_VALUE`;
  const response = await client.request<{ values?: unknown[][] }>({ url });
  return response.data.values ?? [];
}

async function authorized(
  request: NextRequest,
  db: SupabaseClient<Database>,
): Promise<boolean> {
  const authorization = request.headers.get("authorization") ?? "";
  const cronAuthorized =
    Boolean(process.env.CRON_SECRET) &&
    authorization === `Bearer ${process.env.CRON_SECRET}`;
  if (cronAuthorized) return true;

  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return false;

  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) return false;

  const { data: membership, error: membershipError } = await db
    .from("crm_memberships")
    .select("role, enabled")
    .eq("user_id", data.user.id)
    .eq("enabled", true)
    .maybeSingle();

  return !membershipError && membership?.role === "admin" && membership.enabled === true;
}

function errorText(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function googleStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("response" in error)) return undefined;
  const response = error.response;
  if (typeof response !== "object" || response === null || !("status" in response)) return undefined;
  return typeof response.status === "number" ? response.status : undefined;
}

async function run(request: NextRequest): Promise<NextResponse> {
  let db: SupabaseClient<Database>;
  try {
    db = serverDB();
  } catch (error) {
    return fail(errorText(error, "Supabase indisponível"), 503);
  }

  if (!(await authorized(request, db))) return fail("Acesso não autorizado", 401);

  const spreadsheetIds = (process.env.GOOGLE_SHEETS_IDS ?? "")
    .split(",").map((value) => value.trim()).filter(Boolean);
  if (spreadsheetIds.length === 0) return fail("Nenhuma planilha configurada", 503);

  let googleClient: GoogleApiClient;
  try {
    googleClient = await google();
  } catch (error) {
    return fail(errorText(error, "Credenciais Google inválidas"), 503);
  }

  const importedRows: Awaited<ReturnType<typeof parseTab>> = [];
  const sourceSummaries: Array<{ spreadsheet: string; tab: SheetTab; rows: number }> = [];
  const parties: ImportedParty[] = [];
  const errors: SyncError[] = [];

  for (const spreadsheetId of spreadsheetIds) {
    for (const tab of ALLOWED_TABS) {
      try {
        const rows = await sheet(googleClient, spreadsheetId, tab);
        if (tab === "FINANCEIRAS") parties.push(...parseParties(rows));
        else importedRows.push(...parseTab(tab, rows, spreadsheetId));
        sourceSummaries.push({ spreadsheet: spreadsheetId, tab, rows: rows.length });
      } catch (error) {
        errors.push({
          spreadsheet: spreadsheetId,
          tab,
          error: googleStatus(error) === 403
            ? "Sem permissão Google"
            : errorText(error, "Falha ao ler a planilha").slice(0, 120),
        });
      }
    }
  }

  if (importedRows.length === 0) {
    const detail = errors.map((item) => item.tab + ": " + item.error).join("; ");
    return fail("Nenhuma fonte de clientes acessível. " + detail, 503);
  }

  const groupedClients = mergeClients(importedRows);
  const now = new Date().toISOString();

  // Reimportação não substitui a etapa operacional nem evidências de quitação.
  const { data: existing, error: existingError } = await db
    .from("crm_clients")
    .select("id, source_key")
    .in("source_key", groupedClients.map((client) => client.source_key));
  if (existingError) return fail("Erro de conciliação: " + existingError.message);

  const idBySourceKey = new Map((existing ?? []).map((row) => [row.source_key, row.id]));
  const payload = buildSyncPayload(groupedClients, existing ?? [], now);

  // Registros existentes atualizam apenas colunas autorizadas; registros novos incluem name e source_key.
  for (let offset = 0; offset < payload.length; offset += 200) {
    const batch = payload.slice(offset, offset + 200);
    const { error } = await db.from("crm_clients").upsert(
      batch as unknown as Database["public"]["Tables"]["crm_clients"]["Insert"][],
      { onConflict: "source_key" },
    );
    if (error) return fail("Erro de gravação: " + error.message);
  }

  const { data: written, error: writtenError } = await db
    .from("crm_clients")
    .select("id, source_key")
    .in("source_key", groupedClients.map((client) => client.source_key));
  if (writtenError) return fail(writtenError.message);
  for (const row of written ?? []) idBySourceKey.set(row.source_key, row.id);

  const sourceSnapshots: Database["public"]["Tables"]["crm_source_rows"]["Insert"][] =
    importedRows.map((row) => ({
      source_ref: row.source_ref,
      source_spreadsheet: row.source_spreadsheet,
      source_tab: row.source_tab,
      source_row: row.source_row,
      snapshot: row as unknown as Json,
      seen_at: now,
    }));

  for (let offset = 0; offset < sourceSnapshots.length; offset += 150) {
    const { error } = await db.from("crm_source_rows").upsert(
      sourceSnapshots.slice(offset, offset + 150),
      { onConflict: "source_ref" },
    );
    if (error) errors.push({ tab: "origens", error: error.message });
  }

  const deduplicatedParties = [
    ...new Map(parties.map((party) => [
      party.kind + ":" + party.name.toUpperCase(),
      party,
    ])).values(),
  ];
  for (let offset = 0; offset < deduplicatedParties.length; offset += 150) {
    const { error } = await db.from("crm_parties").upsert(
      deduplicatedParties.slice(offset, offset + 150),
      { onConflict: "name,kind" },
    );
    if (error) errors.push({ tab: "instituicoes", error: error.message });
  }

  const status = errors.length > 0 ? "parcial" : "concluido";
  await db.from("crm_import_runs").insert({
    source_file: spreadsheetIds.join(","),
    started_at: now,
    finished_at: new Date().toISOString(),
    status,
    rows_read: importedRows.length,
    clients_merged: groupedClients.length,
    error: errors.length > 0 ? JSON.stringify(errors).slice(0, 4000) : null,
  });

  return NextResponse.json({
    status,
    clients: groupedClients.length,
    rows: importedRows.length,
    sources: sourceSummaries,
    errors,
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return run(request);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return run(request);
}

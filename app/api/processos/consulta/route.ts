import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkCrmAccess } from "../../../../lib/crm-access";
import {
  buildDjenUrl,
  formatProcessNumber,
  normalizeDataJud,
  normalizeDjen,
  resolveCourtAlias,
  type OfficialMovement,
} from "../../../../lib/processos-oficiais";
import type { Database } from "../../../../types/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 35;

const PUBLIC_DATAJUD_KEY =
  "cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw=="; // Chave pública documentada pelo CNJ

type JsonObject = Record<string, unknown>;

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function json(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, private" },
  });
}

async function fetchJson(url: string, options: RequestInit = {}): Promise<unknown> {
  const response = await fetch(url, {
    ...options,
    cache: "no-store",
    signal: AbortSignal.timeout(14000),
  });
  const raw = await response.text();

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Fonte oficial limitou as consultas (HTTP 429). Tente novamente mais tarde.");
    }
    if (response.status === 403) throw new Error("A fonte oficial bloqueou esta rede (HTTP 403).");
    throw new Error("Fonte oficial indisponível (HTTP " + response.status + ").");
  }
  if (raw.trim().startsWith("<")) {
    throw new Error("A fonte oficial retornou HTML ou bloqueio temporário, não dados.");
  }
  if (raw.length > 2400000) {
    throw new Error("Resposta da fonte oficial ultrapassou o tamanho permitido.");
  }
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error("A fonte oficial retornou dados inválidos.");
  }
}

async function datajud(number: string) {
  const alias = resolveCourtAlias(number);
  const url = "https://api-publica.datajud.cnj.jus.br/api_publica_" + alias + "/_search";
  const digits = number.replace(/\D/g, "");
  const key = process.env.DATAJUD_API_KEY || PUBLIC_DATAJUD_KEY;
  const payload = (await fetchJson(url, {
    method: "POST",
    headers: {
      Authorization: "APIKey " + key,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      size: 2,
      query: {
        bool: {
          should: [
            { match: { numeroProcesso: digits } },
            { match: { numeroProcesso: number } },
          ],
          minimum_should_match: 1,
        },
      },
    }),
  })) as { hits?: { hits?: unknown[] } };

  const hits = payload?.hits?.hits;
  if (!Array.isArray(hits)) {
    throw new Error("O DataJud não retornou um resultado processual reconhecível.");
  }
  const matchingHit = hits.find((hit) => {
    if (!isRecord(hit) || !isRecord(hit._source)) return false;
    return String(hit._source.numeroProcesso ?? "").replace(/\D/g, "") === digits;
  });
  const source =
    isRecord(matchingHit) && isRecord(matchingHit._source)
      ? matchingHit._source
      : null;
  const parsed = normalizeDataJud(source, number);

  return {
    ok: true,
    source: "DataJud",
    found: parsed.found,
    items: parsed.movements,
    meta: parsed.meta,
    checkedAt: new Date().toISOString(),
    court: alias.toUpperCase(),
    notice: parsed.found
      ? "Movimentações disponíveis no índice público do CNJ."
      : "CNJ não localizado no índice público do tribunal consultado.",
  };
}

async function djen(number: string, query: URLSearchParams) {
  const start = query.get("inicio") ?? undefined;
  const end = query.get("fim") ?? undefined;
  const url = buildDjenUrl(number, { start, end });
  const response = await fetchJson(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  let items: OfficialMovement[] = normalizeDjen(response, number);

  // Alguns nós do CNJ reconhecem apenas o número sem máscara. Repete uma vez se a lista veio vazia.
  if (items.length === 0) {
    const alternateUrl = new URL(url);
    alternateUrl.searchParams.set("numeroProcesso", number);
    try {
      const alternateResponse = await fetchJson(alternateUrl.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      items = normalizeDjen(alternateResponse, number);
    } catch {
      // A primeira resposta oficial era válida e vazia. Preserva esse resultado.
    }
  }

  return {
    ok: true,
    source: "DJEN",
    found: items.length > 0,
    items,
    checkedAt: new Date().toISOString(),
    notice: items.length > 0
      ? "Publicações localizadas no Diário de Justiça Eletrônico Nacional."
      : "Nenhuma publicação encontrada para as datas consultadas no DJEN.",
    limited: items.length >= 100,
  };
}

function errorDetails(error: unknown): { name: string; message: string } {
  if (error instanceof Error) return { name: error.name, message: error.message };
  return { name: "Error", message: "Falha ao consultar a fonte oficial." };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authorization = request.headers.get("authorization") ?? "";
    const token = authorization.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : "";
    if (!token) return json({ ok: false, error: "Entre no CRM para consultar o processo." }, 401);

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      return json({ ok: false, error: "Conexão segura do CRM não configurada." }, 503);
    }

    const db = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: "Bearer " + token } },
    });
    const {
      data: { user },
      error: authError,
    } = await db.auth.getUser(token);
    if (authError || !user || !(await checkCrmAccess(db, user))) {
      return json({ ok: false, error: "Conta sem permissão para consultar processos neste CRM." }, 403);
    }

    const params = new URL(request.url).searchParams;
    const number = formatProcessNumber(params.get("numero"));
    const source = params.get("fonte");
    if (source !== "datajud" && source !== "djen") {
      return json({ ok: false, error: "Escolha DataJud ou DJEN." }, 400);
    }

    // Consultas oficiais somente para CNJs já salvos no CRM privado deste usuário.
    const [registry, activities] = await Promise.all([
      db.from("crm_processes").select("id").eq("process_number", number).limit(1),
      db.from("crm_completed_activities")
        .select("id")
        .eq("actor_id", user.id)
        .eq("process_number", number)
        .is("deleted_at", null)
        .limit(1),
    ]);

    if (registry.error || activities.error) {
      return json({ ok: false, error: "Não foi possível verificar o cadastro privado do CNJ." }, 503);
    }
    if (!registry.data?.length && !activities.data?.length) {
      return json({
        ok: false,
        error: "Salve o número CNJ em Processos ou em Minhas atividades antes da consulta.",
      }, 403);
    }

    const result = source === "datajud"
      ? await datajud(number)
      : await djen(number, params);
    return json(result);
  } catch (error) {
    const details = errorDetails(error);
    const message =
      details.name === "TimeoutError" || details.name === "AbortError"
        ? "Consulta à fonte oficial excedeu o tempo limite. Tente novamente."
        : details.message;
    const badInput = /CNJ|Data inicial/.test(message);
    return json({ ok: false, error: message }, badInput ? 400 : 502);
  }
}

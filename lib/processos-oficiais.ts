// Normalização de consultas oficiais do CNJ. Não inventa movimentações ausentes.
type UnknownRecord = Record<string, unknown>;

export interface OfficialMovement {
  id: string;
  source: "DataJud" | "DJEN";
  date: string | null;
  title: string;
  description: string;
  code: string | number | null;
  link: string | null;
  courtUnit?: string;
}

export interface ProcessMeta {
  court: string;
  courtUnit: string;
  className: string;
  degree: string;
  filedAt: string | null;
}

export interface DataJudResult {
  found: boolean;
  number: string;
  meta: ProcessMeta | null;
  movements: OfficialMovement[];
}

const COURTS: Record<string, string> = {
  "8.01": "tjac", "8.02": "tjal", "8.03": "tjap", "8.04": "tjam",
  "8.05": "tjba", "8.06": "tjce", "8.07": "tjdft", "8.08": "tjes",
  "8.09": "tjgo", "8.10": "tjma", "8.11": "tjmt", "8.12": "tjms",
  "8.13": "tjmg", "8.14": "tjpa", "8.15": "tjpb", "8.16": "tjpr",
  "8.17": "tjpe", "8.18": "tjpi", "8.19": "tjrj", "8.20": "tjrn",
  "8.21": "tjrs", "8.22": "tjro", "8.23": "tjrr", "8.24": "tjsc",
  "8.25": "tjse", "8.26": "tjsp", "8.27": "tjto",
  "4.01": "trf1", "4.02": "trf2", "4.03": "trf3", "4.04": "trf4",
  "4.05": "trf5", "4.06": "trf6",
  ...Object.fromEntries(Array.from({ length: 24 }, (_, index) => [
    "5." + String(index + 1).padStart(2, "0"),
    "trt" + (index + 1),
  ])),
  "2.00": "stj", "2.01": "stj", "3.00": "tst",
  "3.01": "tst", "6.00": "tse", "7.00": "stm",
};

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as UnknownRecord
    : null;
}

function asText(value: unknown, fallback = ""): string {
  return value === null || value === undefined ? fallback : String(value);
}

function scalarCode(value: unknown): string | number | null {
  return typeof value === "string" || typeof value === "number" ? value : null;
}

export function formatProcessNumber(raw: unknown): string {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.length !== 20) {
    throw new Error("Informe um número CNJ com 20 dígitos.");
  }
  return digits.slice(0, 7) + "-" + digits.slice(7, 9) + "." +
    digits.slice(9, 13) + "." + digits.slice(13, 14) + "." +
    digits.slice(14, 16) + "." + digits.slice(16, 20);
}

export function resolveCourtAlias(raw: unknown): string {
  const digits = formatProcessNumber(raw).replace(/\D/g, "");
  const court = COURTS[digits[13] + "." + digits.slice(14, 16)];
  if (!court) {
    throw new Error("Tribunal não identificado no número CNJ. Confirme o número antes da consulta.");
  }
  return court;
}

export function onlyExactProcess(obj: unknown, expected: string): boolean {
  const record = asRecord(obj);
  if (!record) return false;
  const digits = asText(record.numeroProcesso ?? record.numero_processo ?? "").replace(/\D/g, "");
  return digits.length === 20 && digits === formatProcessNumber(expected).replace(/\D/g, "");
}

export function plainOfficialText(raw: unknown): string {
  return asText(raw)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|li|tr)>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_match, digits: string) => {
      const codePoint = Number(digits);
      return codePoint >= 32 && codePoint < 127 ? String.fromCharCode(codePoint) : "";
    })
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 8000);
}

function dateOf(value: unknown): string | null {
  const raw = asText(value);
  const timestamp = Date.parse(raw);
  if (!raw || Number.isNaN(timestamp)) return null;
  return new Date(timestamp).toISOString();
}

function safeLink(raw: unknown): string | null {
  try {
    const url = new URL(asText(raw));
    return url.protocol === "https:" &&
      (/(^|\.)jus\.br$/.test(url.hostname) || url.hostname === "cnj.jus.br")
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function normalizeDataJud(doc: unknown, number: string): DataJudResult {
  const original = formatProcessNumber(number);
  const record = asRecord(doc);
  if (!record || !onlyExactProcess(record, number)) {
    return { found: false, number: original, meta: null, movements: [] };
  }

  const rawMovements = Array.isArray(record.movimentos) ? record.movimentos.slice(0, 300) : [];
  const movements: OfficialMovement[] = rawMovements.map((rawMovement, index) => {
    const movement = asRecord(rawMovement) ?? {};
    const date = dateOf(movement.dataHora ?? movement.data ?? movement.dataMovimento);
    const title = asText(movement.nome ?? movement.descricao ?? "Movimentação judicial")
      .trim()
      .slice(0, 250);
    const complements = Array.isArray(movement.complementosTabelados)
      ? movement.complementosTabelados
      : [];
    const details = complements
      .map((rawComplement) => {
        const complement = asRecord(rawComplement) ?? {};
        return asText(complement.descricao ?? complement.nome ?? complement.valor ?? "").trim();
      })
      .filter(Boolean)
      .slice(0, 6)
      .join(" · ");

    return {
      id: "dj-" + String(movement.codigo ?? index) + "-" + String(date ?? index),
      source: "DataJud",
      date,
      title,
      description: plainOfficialText(details),
      code: scalarCode(movement.codigo),
      link: null,
    };
  });

  movements.sort((left, right) => (right.date ?? "").localeCompare(left.date ?? ""));
  const courtUnit = asRecord(record.orgaoJulgador);
  const classRecord = asRecord(record.classe);
  const meta: ProcessMeta = {
    court: asText(record.tribunal).slice(0, 35),
    courtUnit: asText(courtUnit?.nome).slice(0, 200),
    className: asText(classRecord?.nome).slice(0, 140),
    degree: asText(record.grau).slice(0, 40),
    filedAt: dateOf(record.dataAjuizamento),
  };

  return { found: true, number: original, meta, movements };
}

export function normalizeDjen(data: unknown, number: string): OfficialMovement[] {
  const record = asRecord(data);
  const rawItems = Array.isArray(data)
    ? data
    : Array.isArray(record?.items)
      ? record.items
      : Array.isArray(record?.content)
        ? record.content
        : null;

  if (!rawItems) throw new Error("O DJEN respondeu sem uma lista de publicações.");

  const seen = new Set<string>();
  return rawItems
    .filter((item) => asRecord(item) !== null && onlyExactProcess(item, number))
    .map((rawItem, index): OfficialMovement => {
      const item = asRecord(rawItem) ?? {};
      const date = dateOf(
        item.data_disponibilizacao ?? item.dataDisponibilizacao ??
        item.data_publicacao ?? item.dataPublicacao,
      );
      return {
        id: "djen-" + String(item.hash ?? item.id ?? index),
        source: "DJEN",
        date,
        title: asText(item.tipoComunicacao ?? item.tipo_comunicacao ?? "Publicação no DJEN").slice(0, 180),
        description: plainOfficialText(item.texto ?? item.teor ?? item.conteudo ?? ""),
        code: null,
        courtUnit: asText(item.nomeOrgao ?? item.nome_orgao ?? "").slice(0, 140),
        link: safeLink(item.link ?? item.url),
      };
    })
    .filter((item) => {
      const key = item.id + "-" + item.date;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((left, right) => (right.date ?? "").localeCompare(left.date ?? ""));
}

export function mergeEvents(
  ...sources: ReadonlyArray<readonly OfficialMovement[]>
): OfficialMovement[] {
  const all = sources.flat().filter(Boolean);
  all.sort((left, right) => (right.date ?? "").localeCompare(left.date ?? ""));
  const seen = new Set<string>();
  return all.filter((item) => {
    const key = item.source + "|" + item.id + "|" + item.date;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildDjenUrl(
  number: string,
  { start, end }: { start?: string; end?: string } = {},
): string {
  const digits = formatProcessNumber(number).replace(/\D/g, "");
  const today = new Date().toISOString().slice(0, 10);
  const first = new Date(Date.now() - 730 * 86400000).toISOString().slice(0, 10);
  const begin = /^\d{4}-\d\d-\d\d$/.test(start ?? "") ? start! : first;
  const until = /^\d{4}-\d\d-\d\d$/.test(end ?? "") ? end! : today;
  if (begin > until) throw new Error("Data inicial deve ser anterior à data final.");

  const params = new URLSearchParams({
    numeroProcesso: digits,
    dataDisponibilizacaoInicio: begin,
    dataDisponibilizacaoFim: until,
    pagina: "1",
    itensPorPagina: "100",
  });
  return "https://comunicaapi.pje.jus.br/api/v1/comunicacao?" + params.toString();
}

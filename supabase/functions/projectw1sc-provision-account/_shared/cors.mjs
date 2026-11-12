const PRODUCTION_ORIGIN = 'https://quitacao-get.vercel.app';

const FIXED_ORIGINS = new Set([
  PRODUCTION_ORIGIN,
  'https://quitacao-get-4g56.vercel.app',
  'https://quitacao-get-kawpk.vercel.app',
  'https://quitacao-get-git-main-kawpk.vercel.app',
  'https://quitacao-get-git-projectw1sc-crm-kawpk.vercel.app',
  'https://quitacao-h0561mu1s-kawpk.vercel.app',
]);

const SUPABASE_REQUEST_HEADERS = [
  'authorization',
  'x-client-info',
  'apikey',
  'content-type',
  'x-retry-count',
  'traceparent',
  'tracestate',
  'baggage',
].join(', ');

function parseHttpsOrigin(value) {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' || parsed.origin !== value) return null;
    if (parsed.username || parsed.password) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

/**
 * Restricts browser origins to the CRM production host, the project's own
 * Vercel deployment aliases, and optional exact origins configured in
 * CORS_ALLOWED_ORIGINS. This is intentionally not a wildcard policy.
 */
export function isAllowedAppOrigin(origin, additionalOrigins = '') {
  if (!origin) return true;

  const parsedOrigin = parseHttpsOrigin(origin);
  if (!parsedOrigin) return false;
  if (FIXED_ORIGINS.has(parsedOrigin)) return true;

  const hostname = new URL(parsedOrigin).hostname;
  if (/^quitacao-get-[a-z0-9]{4,12}\.vercel\.app$/i.test(hostname)) return true;
  if (/^quitacao-get-[a-z0-9-]+-kawpk\.vercel\.app$/i.test(hostname)) return true;

  const configuredOrigins = String(additionalOrigins)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return configuredOrigins.some((item) => parseHttpsOrigin(item) === parsedOrigin);
}

export function corsHeadersFor(origin, additionalOrigins = '') {
  const allowed = isAllowedAppOrigin(origin, additionalOrigins);
  const headers = {
    'Access-Control-Allow-Headers': SUPABASE_REQUEST_HEADERS,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json;charset=utf-8',
    'Cache-Control': 'no-store',
    'Vary': 'Origin',
  };

  if (origin && allowed) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

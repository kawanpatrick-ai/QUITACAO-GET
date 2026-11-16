/**
 * Fetch all rows from a Supabase query factory without silently stopping at
 * PostgREST's default/max page size. A factory is used so every page receives
 * a fresh query builder with the same filters and ordering.
 */
export async function fetchAllRows(queryFactory, pageSize = 1000) {
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new TypeError('pageSize must be a positive integer');
  }
  if (typeof queryFactory !== 'function') {
    throw new TypeError('queryFactory must be a function returning a Supabase query');
  }

  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await queryFactory().range(from, from + pageSize - 1);
    if (error) return { data: null, error };

    const page = data || [];
    rows.push(...page);
    if (page.length < pageSize) return { data: rows, error: null };
  }
}

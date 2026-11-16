import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchAllRows } from '../lib/supabase-pagination.mjs';

function queryFor(rows, ranges, failureAt = -1) {
  return () => ({
    range: async (from, to) => {
      ranges.push([from, to]);
      if (from === failureAt) return { data: null, error: new Error('query failed') };
      return { data: rows.slice(from, to + 1), error: null };
    }
  });
}

test('fetchAllRows returns every row across multiple pages', async () => {
  const ranges = [];
  const rows = Array.from({ length: 2505 }, (_, id) => ({ id }));
  const result = await fetchAllRows(queryFor(rows, ranges), 1000);

  assert.equal(result.error, null);
  assert.equal(result.data.length, 2505);
  assert.deepEqual(result.data[0], { id: 0 });
  assert.deepEqual(result.data.at(-1), { id: 2504 });
  assert.deepEqual(ranges, [[0,999],[1000,1999],[2000,2999]]);
});

test('fetchAllRows requests a final page when row count is an exact multiple', async () => {
  const ranges = [];
  const result = await fetchAllRows(queryFor([{id:1},{id:2}], ranges), 2);

  assert.equal(result.data.length, 2);
  assert.deepEqual(ranges, [[0,1],[2,3]]);
});

test('fetchAllRows returns the database error without returning partial rows', async () => {
  const ranges = [];
  const result = await fetchAllRows(queryFor([{id:1},{id:2}], ranges, 2), 2);

  assert.equal(result.data, null);
  assert.equal(result.error.message, 'query failed');
});

test('fetchAllRows rejects invalid page sizes', async () => {
  await assert.rejects(() => fetchAllRows(() => ({}), 0), /pageSize/);
});

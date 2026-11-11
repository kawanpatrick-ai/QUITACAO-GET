import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateNextReturn} from '../lib/return-date.mjs';

test('adds the waiting interval in business days, skipping weekends', () => {
  assert.equal(calculateNextReturn('2026-11-06', 1), '2026-11-09');
  assert.equal(calculateNextReturn('2026-11-06', 2), '2026-11-10');
});

test('returns the contact date when the waiting interval is zero', () => {
  assert.equal(calculateNextReturn('2026-11-06', 0), '2026-11-06');
});

test('returns null when the contact date or waiting interval is missing', () => {
  assert.equal(calculateNextReturn('', 3), null);
  assert.equal(calculateNextReturn('2026-11-06', ''), null);
});

test('rejects invalid dates and negative or fractional waiting intervals', () => {
  assert.throws(() => calculateNextReturn('2026-02-30', 2), /data válida/);
  assert.throws(() => calculateNextReturn('2026-11-06', -1), /não negativo/);
  assert.throws(() => calculateNextReturn('2026-11-06', 1.5), /inteiro/);
});

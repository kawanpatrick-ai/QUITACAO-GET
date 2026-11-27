import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const readPng = (path) => {
  const bytes = readFileSync(new URL('../' + path, import.meta.url));
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', path + ' must be a valid PNG');
  let offset = 8;
  const chunks = new Map();
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    const start = offset + 8;
    const end = start + length;
    assert.ok(end + 4 <= bytes.length, path + ' has a truncated PNG chunk');
    chunks.set(type, bytes.subarray(start, end));
    offset = end + 4;
    if (type === 'IEND') break;
  }
  const header = chunks.get('IHDR');
  assert.ok(header, path + ' must contain IHDR');
  const palette = chunks.get('PLTE');
  const transparency = chunks.get('tRNS');
  assert.ok(palette && palette.length % 3 === 0, path + ' must contain a palette');
  assert.ok(transparency && transparency.includes(0) && transparency.includes(255), path + ' must preserve transparent background and opaque artwork');
  return {
    width: header.readUInt32BE(0),
    height: header.readUInt32BE(4),
    colors: Array.from({ length: palette.length / 3 }, (_, i) => palette.subarray(i * 3, i * 3 + 3).toString('hex')),
  };
};

test('light-background GET logo has a transparent background and visible navy wordmark', () => {
  const image = readPng('public/branding/get-logo.png');
  assert.deepEqual([image.width, image.height], [200, 83]);
  assert.ok(image.colors.includes('14283f'));
  assert.ok(image.colors.includes('2c81b7'));
});

test('dark-background GET logo has a transparent background and visible white wordmark', () => {
  const image = readPng('public/branding/get-logo-white.png');
  assert.deepEqual([image.width, image.height], [200, 83]);
  assert.ok(image.colors.includes('ffffff'));
  assert.ok(image.colors.includes('2c81b7'));
});

test('compact sidebar mark is a valid high-resolution GET symbol', () => {
  const image = readPng('public/branding/get-symbol.png');
  assert.deepEqual([image.width, image.height], [186, 186]);
  assert.ok(image.colors.includes('2c81b7'));
});

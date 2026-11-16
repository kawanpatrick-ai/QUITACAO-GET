import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

test('TypeScript migration is strict without forcing an unsafe JavaScript rewrite', async () => {
  const config = JSON.parse(await readFile(new URL('tsconfig.json', root), 'utf8'));

  assert.equal(config.compilerOptions.strict, true);
  assert.equal(config.compilerOptions.allowJs, true);
  assert.equal(config.compilerOptions.checkJs, false);
  assert.equal(config.compilerOptions.noEmit, true);
  assert.equal(config.compilerOptions.moduleResolution, 'bundler');
  assert.ok(config.exclude.includes('supabase/functions'));
});

test('typecheck validates the app and preserves Deno Edge Function validation', async () => {
  const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));

  assert.match(pkg.scripts.typecheck, /tsc --noEmit/);
  assert.match(pkg.scripts.typecheck, /deno check supabase\/functions\/projectw1sc-provision-account\/index\.ts/);
  assert.ok(pkg.devDependencies.typescript);
  assert.ok(pkg.devDependencies['@types/react']);
  assert.ok(pkg.devDependencies['@types/node']);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const wrangler = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
const postcss = readFileSync(new URL('../postcss.config.mjs', import.meta.url), 'utf8');

test('the app uses Node.js 22 and provides the Cloudflare OpenNext scripts', () => {
  assert.equal(pkg.engines.node, '22.x');
  assert.ok(pkg.scripts['cf:build']);
  assert.ok(pkg.scripts['cf:preview']);
  assert.ok(pkg.scripts['cf:deploy']);
  assert.ok(pkg.devDependencies['@opennextjs/cloudflare']);
  assert.ok(pkg.devDependencies.wrangler);
});

test('Tailwind CSS 4 is wired through the PostCSS plugin', () => {
  assert.ok(pkg.devDependencies.tailwindcss);
  assert.ok(pkg.devDependencies['@tailwindcss/postcss']);
  assert.match(postcss, /@tailwindcss\/postcss/);
});

test('Cloudflare is configured for OpenNext, Node compatibility, and the correct Supabase project', () => {
  assert.match(wrangler, /\.open-next\/worker\.js/);
  assert.match(wrangler, /\.open-next\/assets/);
  assert.match(wrangler, /nodejs_compat/);
  assert.match(wrangler, /https:\/\/ntkvwdyifxayoksihjih\.supabase\.co/);
  assert.match(wrangler, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
});

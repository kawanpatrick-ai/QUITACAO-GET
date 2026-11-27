import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

test('the CRM uses the requested product name in metadata and login', () => {
  const layout = read('app/layout.jsx');
  const page = read('app/page.jsx');
  const auth = read('components/professional-auth.jsx');
  const shell = read('components/crm-shell.jsx');

  assert.match(layout, /title\s*:\s*['"]Controle de Quitação\s*\|\s*GET Assessoria['"]/);
  assert.match(page, /Acesse o Controle de Quitação/);
  assert.match(page, /Entrar no Controle de Quitação/);
  assert.doesNotMatch(auth + shell, /ProjectW1SC|W1 Capital|GET CRM/);
  assert.match(shell, /Controle de Quitação/);
});

test('login and sidebar use the supplied GET logo assets, not the old W1SC mark', () => {
  const auth = read('components/professional-auth.jsx');
  const shell = read('components/crm-shell.jsx');

  assert.match(auth, /\/branding\/get-crm-wordmark\.svg/);
  assert.match(shell, /\/branding\/get-crm-symbol\.svg/);
  assert.match(shell, /\/branding\/get-crm-wordmark\.svg/);
  assert.ok(existsSync(new URL('../public/branding/get-logo.png', import.meta.url)));
  assert.ok(existsSync(new URL('../public/branding/get-logo-white.png', import.meta.url)));
  assert.ok(existsSync(new URL('../public/branding/get-symbol.png', import.meta.url)));
});

test('auth identity uses a modern sans-serif family and GET blue palette', () => {
  const css = read('app/brand-auth.css');

  assert.match(css, /font-family:[^;]*(?:Manrope|Inter|ui-sans-serif)/);
  assert.match(css, /#14283f/i);
  assert.match(css, /#2c81b7/i);
  assert.doesNotMatch(css, /Georgia|Times New Roman/);
  assert.doesNotMatch(css, /#49172e|#71304c|#471b30/);
});

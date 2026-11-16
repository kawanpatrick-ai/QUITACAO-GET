import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('the application loads one corporate design system and no character theme layers', async () => {
  const layout = await read('app/layout.jsx');
  assert.match(layout, /corporate-design\.css/);
  assert.doesNotMatch(layout, /madara-theme|anime-themes|anime-immersive|anime-header-banners/);
});

test('the CRM shell uses a fixed corporate appearance instead of user-selected anime themes', async () => {
  const shell = await read('components/crm-shell.jsx');
  assert.match(shell, /data-crm-theme\s*=\s*["']corporate["']/);
  assert.doesNotMatch(shell, /madara|CRM_THEMES|resolveTheme|crm-theme/);
});

test('settings no longer exposes theme, custom palette or wallpaper controls', async () => {
  const settings = await read('app/configuracoes/page.jsx');
  assert.doesNotMatch(settings, /CRM_THEMES|resolveTheme|Madara|Aparência do CRM|Personalização avançada|Imagem de fundo|setChosenTheme/);
  assert.match(settings, /Meu perfil/);
  assert.match(settings, /Alterar senha/);
});

test('the corporate design tokens define readable semantic foreground and surface colors', async () => {
  const css = await read('app/corporate-design.css');
  for (const token of ['--ui-page', '--ui-surface', '--ui-ink', '--ui-muted', '--ui-accent', '--ui-accent-ink', '--ui-nav', '--ui-nav-ink', '--ui-border', '--ui-tint', '--ui-tint-ink']) {
    assert.match(css, new RegExp(token + '\\s*:'));
  }
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /:focus-visible/);
});

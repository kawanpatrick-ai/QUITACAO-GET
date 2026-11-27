import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');
test('the application loads one corporate design system and no character theme layers', async () => {
 const layout=await read('app/layout.jsx');assert.ok(layout.includes('corporate-design.css'));assert.ok(layout.includes('data-crm-theme="corporate"'));
 assert.doesNotMatch(layout,/madara-theme|anime-themes|anime-immersive|anime-header-banners/);
});
test('the CRM shell uses the supplied GET identity and the new product name',async()=>{
 const shell=await read('components/crm-shell.jsx');assert.ok(shell.includes('get-crm-symbol.svg'));assert.ok(shell.includes('get-crm-wordmark.svg'));
 assert.ok(shell.includes('Controle de Quitação'));assert.doesNotMatch(shell,/ProjectW1SC|W1 Capital|GET CRM/);
 assert.doesNotMatch(shell,/madara|CRM_THEMES|resolveTheme|crm-theme/i);
});
test('settings does not expose an uncontrolled theme or wallpaper switcher',async()=>{
 const settings=await read('app/configuracoes/page.jsx');assert.doesNotMatch(settings,/CRM_THEMES|resolveTheme|Madara|Aparência do CRM|Personalização avançada|Imagem de fundo|setChosenTheme/);
 assert.match(settings,/Meu perfil/);assert.match(settings,/Alterar senha/);
});
test('corporate design tokens define readable semantic colors and modern type',async()=>{
 const css=await read('app/corporate-design.css');
 for(const token of ['--ui-page','--ui-surface','--ui-ink','--ui-muted','--ui-accent','--ui-accent-ink','--ui-nav','--ui-nav-ink','--ui-border','--ui-tint','--ui-tint-ink']) assert.match(css,new RegExp(token+'\\s*:'));
 assert.match(css,/font-family:/);assert.match(css,/prefers-reduced-motion/);assert.match(css,/:focus-visible/);
});

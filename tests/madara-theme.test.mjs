import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');

test('Madara and character theme styles are not loaded by the application',async()=>{
 const layout=await read('app/layout.jsx');
 assert.doesNotMatch(layout,/madara-theme|anime-themes|anime-immersive|anime-header-banners/);
 assert.match(layout,/corporate-design\.css/);
});

test('the CRM shell uses GET branding and has no anime theme runtime',async()=>{
 const shell=await read('components/crm-shell.jsx');
 assert.match(shell,/get-crm-symbol\.svg/);
 assert.match(shell,/get-crm-wordmark\.svg/);
 assert.doesNotMatch(shell,/Madara|madara|CRM_THEMES|resolveTheme|crm-theme/);
});

test('settings no longer offers Madara, anime themes or custom wallpaper controls',async()=>{
 const settings=await read('app/configuracoes/page.jsx');
 assert.doesNotMatch(settings,/Madara|CRM_THEMES|resolveTheme|Aparência do CRM|Personalização avançada|Imagem de fundo/);
 assert.match(settings,/Meu perfil/);
});

test('the corporate palette uses accessible semantic tokens',async()=>{
 const css=await read('app/corporate-design.css');
 for(const token of ['--ui-page','--ui-surface','--ui-ink','--ui-muted','--ui-accent','--ui-accent-ink','--ui-nav','--ui-nav-ink','--ui-border']) assert.ok(css.includes(token));
 assert.match(css,/prefers-reduced-motion/);
 assert.match(css,/:focus-visible/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Naruto and Sasuke are no longer selectable or loaded as CRM themes',()=>{
 const layout=read('app/layout.jsx');
 const settings=read('app/configuracoes/page.jsx');
 const shell=read('components/crm-shell.jsx');
 assert.doesNotMatch(layout,/anime-themes|anime-immersive|anime-header-banners/);
 assert.doesNotMatch(settings,/Naruto|Sasuke|Madara|CRM_THEMES|Escolha um tema/);
 assert.doesNotMatch(shell,/naruto|sasuke|madara|CRM_THEMES/i);
});

test('the new identity is GET Assessoria Financeira',()=>{
 const shell=read('components/crm-shell.jsx');
 const layout=read('app/layout.jsx');
 assert.match(shell,/get-logo-white\.png/);
 assert.match(layout,/GET Assessoria Financeira/);
});

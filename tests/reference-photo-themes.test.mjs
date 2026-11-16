import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('the former anime theme asset directory is removed from the application',()=>{
 const layout=read('app/layout.jsx');
 assert.doesNotMatch(layout,/anime-themes|anime-immersive|anime-header-banners|madara-theme/);
});

test('the CRM shell and theme registry contain only the corporate GET identity',()=>{
 const shell=read('components/crm-shell.jsx');
 const themes=read('lib/crm-themes.mjs');
 assert.ok(shell.includes('get-crm-wordmark.svg'));
 assert.doesNotMatch(themes,/id:'naruto'|id:'sasuke'|id:'madara'/);
 assert.doesNotMatch(shell,/naruto|sasuke|madara|sharingan/i);
});

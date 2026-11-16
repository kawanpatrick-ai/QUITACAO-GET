import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('character panoramas and anime banners are not loaded into the GET CRM',()=>{
 const layout=read('app/layout.jsx');
 assert.doesNotMatch(layout,/anime-header-banners|anime-immersive|anime-themes/);
 assert.match(layout,/corporate-design\.css/);
});

test('the corporate shell uses GET-owned brand assets instead of character marks',()=>{
 const shell=read('components/crm-shell.jsx');
 assert.match(shell,/get-crm-symbol\.svg/);
 assert.match(shell,/get-crm-wordmark\.svg/);
 assert.doesNotMatch(shell,/madara|naruto|sasuke|sharingan/i);
});

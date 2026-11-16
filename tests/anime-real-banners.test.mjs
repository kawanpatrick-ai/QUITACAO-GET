import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Naruto and Sasuke banner assets are not loaded by the application',()=>{
 const layout=read('app/layout.jsx');
 assert.doesNotMatch(layout,/anime-header-banners|anime-immersive|anime-themes/);
 assert.match(layout,/corporate-design\.css/);
});

test('real CRM headers remain live content under the corporate design system',()=>{
 const css=read('app/corporate-design.css');
 assert.match(css,/\.reference-header/);
 assert.match(css,/\.app-content/);
 assert.match(css,/background:var\(--ui-page\)/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('the live application no longer loads anime or character theme layers',()=>{
 const layout=read('app/layout.jsx');
 for(const legacy of ['anime-themes.css','anime-immersive.css','anime-header-banners.css','madara-theme.css']) assert.doesNotMatch(layout,new RegExp(legacy));
 assert.match(layout,/corporate-design\.css/);
 assert.match(layout,/data-crm-theme="corporate"/);
});

test('the corporate design styles real CRM content instead of replacing it with static artwork',()=>{
 const css=read('app/corporate-design.css');
 for(const selector of ['.app-shell','.app-sidebar','.app-content','.reference-panel','.task-board','.reference-table']) assert.ok(css.includes(selector));
 assert.match(css,/prefers-reduced-motion/);
});

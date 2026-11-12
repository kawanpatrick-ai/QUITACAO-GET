import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {CRM_THEMES,resolveTheme,contrastRatio} from '../lib/crm-themes.mjs';

const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');

test('Madara is a selectable first-class theme with WCAG AA semantic contrast',()=>{
 const theme=CRM_THEMES.find(item=>item.id==='madara');
 assert.ok(theme,'Madara theme must be available in the theme picker');
 assert.equal(theme.label,'Madara · Lua Vermelha');
 assert.equal(resolveTheme('madara'),'madara');
 for(const [foreground,background] of [
  ['ink','surface'],['muted','surface'],['accentInk','accent'],['navInk','nav'],
  ['tintInk','tint'],['warningInk','warningBg'],['successInk','successBg'],
  ['dangerInk','dangerBg'],['neutralInk','neutralBg']
 ]) assert.ok(contrastRatio(theme[foreground],theme[background])>=4.5,foreground+' / '+background);
});

test('Madara uses the three user-supplied artworks as committed WebP assets',()=>{
 for(const [path,minBytes] of [
  ['public/themes/madara-sidebar.webp',10000],
  ['public/themes/madara-banner.webp',11000],
  ['public/themes/madara-moon.webp',2900]
 ]){
  assert.ok(existsSync(new URL(path,root)),path+' is missing');
  const asset=readFileSync(new URL(path,root));
  assert.equal(asset.toString('ascii',0,4),'RIFF',path+' must be a WebP RIFF asset');
  assert.equal(asset.toString('ascii',8,12),'WEBP',path+' must have the WebP signature');
  assert.ok(asset.length>=minBytes,path+' appears truncated or unexpectedly degraded');
 }
});

test('Madara theme places supplied character art away from live header text and uses the red-moon image as ambient art',()=>{
 const layout=read('app/layout.jsx');
 const css=read('app/madara-theme.css');
 assert.ok(layout.indexOf("madara-theme.css")>layout.indexOf("theme-accessibility.css"));
 assert.match(css,/data-crm-theme="madara"/);
 assert.match(css,/madara-banner\.webp/);
 assert.match(css,/madara-sidebar\.webp/);
 assert.match(css,/madara-moon\.webp/);
 assert.match(css,/\.reference-header/);
 assert.match(css,/\.task-header/);
 assert.match(css,/\.app-sidebar/);
 assert.match(css,/\.report-executive-hero/);
 assert.match(css,/\.settings-theme-madara/);
 assert.match(css,/padding:\s*25px 26px 25px 62%/);
 assert.match(css,/width:\s*59%/);\n assert.match(css,/background-size:\s*100% 100%, auto 100%/,'Keep source artwork proportional rather than cropping it to fill a wide banner');\n assert.match(css,/background-size:\s*auto 100% !important/);
 assert.match(css,/@media\s*\(max-width:\s*750px\)/);
 assert.match(css,/padding:\s*148px 18px 18px/);
 assert.doesNotMatch(css,/madara-ems\.svg/,'Do not overlay an invented Sharingan mark on the source artwork');
});

test('Madara theme picker does not overlay a generated or inaccurate eye mark',()=>{
 const css=read('app/madara-theme.css');
 assert.match(css,/\.settings-theme-preview::after\s*\{\s*content:\s*none/);
 assert.match(css,/settings-theme-preview[\s\S]*madara-banner\.webp/);
});

test('Madara visual layer retains accessible focus, reduced-motion and print behavior',()=>{
 const css=read('app/madara-theme.css');
 assert.match(css,/\.app-content :focus-visible/);
 assert.match(css,/\.app-sidebar :focus-visible/);
 assert.match(css,/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
 assert.match(css,/@media\s+print/);
});

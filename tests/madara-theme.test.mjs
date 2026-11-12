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
 assert.match(css,/background-size:\s*100% 100%,100% 100%,cover/,'The red-moon reference must cover the full page');
 assert.match(css,/background-attachment:[^;]*fixed/,'Keep the page background fixed while content scrolls');
 assert.match(css,/\.reference-header/);
 assert.match(css,/\.task-header/);
 assert.match(css,/\.app-sidebar/);
 assert.match(css,/\.report-executive-hero/);
 assert.match(css,/\.settings-theme-madara/);
 assert.match(css,/padding:\s*25px 28px 25px 46%/);
 assert.match(css,/width:\s*58%/);
 assert.match(css,/background-size:\s*100% 100%,cover/,'Use proportional cover for the wide header artwork');
 assert.match(css,/background-size:\s*cover!important/);
 assert.match(css,/@media\s*\(max-width:\s*750px\)/);
 assert.match(css,/padding:\s*148px 18px 18px/);
 assert.doesNotMatch(css,/madara-ems\.svg/,'Do not overlay an invented Sharingan mark on the source artwork');
});

test('Madara theme picker does not overlay a generated or inaccurate eye mark',()=>{
 const css=read('app/madara-theme.css');
 assert.match(css,/\.settings-theme-preview::after\s*\{\s*content:\s*none/);
 assert.match(css,/\.settings-theme-madara \.settings-theme-preview[\s\S]*var\(--madara-banner-image\)/);
});

test('Madara visual layer retains accessible focus, reduced-motion and print behavior',()=>{
 const css=read('app/madara-theme.css');
 assert.match(css,/\.app-content :focus-visible/);
 assert.match(css,/\.app-sidebar :focus-visible/);
 assert.match(css,/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
 assert.match(css,/@media\s+print/);
});


test('Madara applies a coherent premium visual system across the whole CRM without changing app behavior',()=>{
 const css=read('app/madara-theme.css');
 for(const selector of [
  '.app-shell .app-content','.reference-dashboard','.task-shell','.task-main',
  '.settings-dashboard','.report-dashboard','.processes-dashboard',
  '.app-sidebar::before','.app-nav-link svg','.reference-kpi-icon',
  '.reference-panel','.task-board','.settings-panel','.report-filters',
  '.app-content :is(button,a,[role="button"]) svg','.app-content :focus-visible'
 ]) assert.ok(css.includes(selector),'Missing global Madara styling for '+selector);
 assert.match(css,/font-family:\s*['"]?Manrope/);
 assert.match(css,/font-family:\s*['"]?Cinzel/);
 assert.match(css,/background-size:\s*contain/,'Sidebar artwork must remain centered and undistorted');
 assert.match(css,/background-position:\s*center center/);
 assert.match(css,/drop-shadow\(0 0 5px rgba\(255,37,61/i,'Icons should use a controlled bright red glow');
 assert.match(css,/--madara-card-radius/);
 assert.match(css,/--madara-space/);
});

test('Madara background remains visible behind transparent route wrappers and does not cover readable panels',()=>{
 const css=read('app/madara-theme.css');
 assert.match(css,/\.app-content :is\([\s\S]*\.reference-dashboard[\s\S]*background-color:\s*transparent/);
 assert.match(css,/\.reference-panel[\s\S]*background-color:\s*rgba\(22,13,17,\.94\)/);
});

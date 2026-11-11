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

test('Madara uses committed artwork and the authentic Eternal Mangekyo pattern, not a generic three-tomoe Sharingan',()=>{
 for(const path of ['public/themes/madara-banner.webp','public/themes/madara-sidebar.webp','public/themes/madara-ems.svg']){
  assert.ok(existsSync(new URL(path,root)),path+' is missing');
 }
 const banner=readFileSync(new URL('public/themes/madara-banner.webp',root));
 const sidebar=readFileSync(new URL('public/themes/madara-sidebar.webp',root));
 assert.equal(banner.toString('ascii',0,4),'RIFF');
 assert.equal(banner.toString('ascii',8,12),'WEBP');
 assert.equal(sidebar.toString('ascii',0,4),'RIFF');
 assert.equal(sidebar.toString('ascii',8,12),'WEBP');
 assert.ok(banner.length>30000);
 assert.ok(sidebar.length>15000);
 const eye=read('public/themes/madara-ems.svg');
 assert.match(eye,/id="ems-outer-iris"/);
 assert.match(eye,/id="ems-straight-tomoe"/);
 assert.match(eye,/id="ems-central-pupil"/);
 assert.equal((eye.match(/class="ems-satellite"/g)||[]).length,3,'EMS must have three circular satellite nodes');
 assert.equal((eye.match(/class="ems-radial-bar"/g)||[]).length,3,'EMS must include the three straight tomoe extensions');
 assert.doesNotMatch(eye,/id="tomoe-1"|rotate\(120 150 150\)|rotate\(-120 150 150\)/,'Do not ship the generic three-tomoe Sharingan');
});

test('Madara visual layer is loaded after the shared accessibility layer and covers live CRM regions',()=>{
 const layout=read('app/layout.jsx');
 const css=read('app/madara-theme.css');
 assert.ok(layout.indexOf("madara-theme.css")>layout.indexOf("theme-accessibility.css"));
 assert.match(css,/data-crm-theme="madara"/);
 assert.match(css,/madara-banner\.webp/);
 assert.match(css,/madara-sidebar\.webp/);
 assert.match(css,/madara-ems\.svg/);
 assert.match(css,/\.reference-header/);
 assert.match(css,/\.task-header/);
 assert.match(css,/\.app-sidebar/);
 assert.match(css,/\.report-executive-hero/);
 assert.match(css,/\.settings-theme-madara/);
 assert.match(css,/@media\s*\(max-width:\s*750px\)/);
 assert.match(css,/@media\s+print/);
});

test('Madara eye vector is attributed under the source file license',()=>{
 const credits=read('docs/ASSET-ATTRIBUTIONS.md');
 assert.match(credits,/ShounenSuki/);
 assert.match(credits,/Wikimedia Commons/);
 assert.match(credits,/CC BY-SA 3\.0/);
});
